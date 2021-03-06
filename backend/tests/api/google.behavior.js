'use strict';

const request = require('supertest');
const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const castToObjectId = require('mongodb').ObjectId;
const sinon = require('sinon');
const assert = require('assert');
const nock = require('nock');
const initObjectIdStub = require('objectid-stub');
const passport = require('passport');

const initRoutes = require('../../app/routes');

describe('OAuth Google endpoints', () => {
  let context;
  const fakeState = new Buffer(JSON.stringify({
    contents: { fake: 'token' },
  })).toString('base64');

  before(done => {
    context = {
      env: { NODE_ENV: 'development' },
    };
    context.env.SESSION_SECRET = 'none';
    context.env.STATIC_PATH = path.join(__dirname, '..', '..', '..', 'mobile', 'www');
    context.env.GOOGLE_ID = '123-456-789';
    context.env.GOOGLE_SECRET = 'shhh-its-a-secret';
    context.tokens = {
      createToken: sinon.stub().returns({
        contents: { fake: 'token' },
      }),
      checkToken: sinon.stub().returns(true),
    };
    context.time = sinon.stub().returns(1664);
    context.passport = passport;
    context.logger = {
      error: sinon.spy(),
      debug: sinon.spy(),
      info: sinon.spy(),
    };
    context.createObjectId = initObjectIdStub({
      ctor: castToObjectId,
    });
    context.base = 'http://tripstory.insertafter.com';
    MongoClient.connect('mongodb://localhost:27017/tripstory_test')
      .then(db => {
        context.db = db;
        done();
      });
  });

  before(done => {
    context.app = express();
    initRoutes(context);
    done();
  });

  beforeEach(done => {
    context.bus = {
      trigger: sinon.spy(),
    };
    done();
  });

  afterEach(done => {
    context.db.collection('users').deleteMany({}, done);
  });

  describe('entry point', () => {

    it('should redirect to the OAuth page', done => {
      request(context.app).get('/auth/google')
        .expect(302)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert(context.tokens.createToken.callCount, 1);
          assert.equal(
            res.headers.location,
            `https://accounts.google.com/o/oauth2/auth?response_type=code&redirect_uri=${encodeURIComponent(
  `${context.base}/auth/google/callback`
)}&scope=profile%20email&state=${encodeURIComponent(fakeState)}&client_id=${context.env.GOOGLE_ID}`
          );
          done();
        });
    });

  });

  describe('callback endpoint', () => {
    let accessTokenCall;
    let profileCall;

    beforeEach(() => {
      accessTokenCall = nock('https://accounts.google.com:443', {
        encodedQueryParams: true,
      })
      .post(
        '/o/oauth2/token',
        `grant_type=authorization_code&redirect_uri=${encodeURIComponent(
  `${context.base}/auth/google/callback`
)}&client_id=${context.env.GOOGLE_ID}&client_secret=${context.env.GOOGLE_SECRET}&code=THISISIT`)
      .reply(
        200, {
          access_token: 'COMMON_BOY',
          token_type: 'bearer',
          expires_in: '13060800',
          expires_at: 1467821352,
          refresh_token: 'COME_AGAIN_MAN',
        }, {
          'content-type': 'text/plain; charset=UTF-8',
        });


      profileCall = nock('https://www.googleapis.com:443', {
        encodedQueryParams: true,
      })
      .get('/plus/v1/people/me')
      .query({
        access_token: 'COMMON_BOY',
      })
      .reply(200, {
        kind: 'plus#person',
        etag: '"Plop"',
        occupation: 'To fake',
        skills: 'Fake',
        birthday: '0000-04-28',
        gender: 'male',
        emails: [{
          value: 'clown@fake.fr',
          type: 'account',
        }],
        urls: [{
          value: 'http://twitter.com/nfroidure',
          type: 'otherProfile',
          label: 'Twitter',
        }],
        objectType: 'person',
        id: '1664',
        displayName: 'Nicolas Froidure',
        name: {
          familyName: 'FROIDURE',
          givenName: 'Nicolas',
        },
        tagline: 'Lol',
        braggingRights: 'Faking everything',
        aboutMe: 'I Fake all the time<br />',
        url: 'https://plus.google.com/+Lol',
        image: {
          url: 'https://robohash.org/lol',
          isDefault: false,
        },
        organizations: [{
          name: 'Fake academy',
          title: 'Faker',
          type: 'school',
          startDate: '0',
          endDate: '3042',
          primary: false,
        }],
        placesLived: [{
          value: 'Smallville',
          primary: true,
        }],
        isPlusUser: true,
        language: 'fr',
        circledByCount: 332,
        verified: false,
        cover: {
          layout: 'banner',
          coverPhoto: {
            url: 'https://robohash.org/lol',
            height: 332,
            width: 940,
          },
          coverInfo: {
            topImageOffset: -8,
            leftImageOffset: 0,
          },
        },
      }, {
        'content-type': 'text/javascript; charset=UTF-8',
      });
    });

    describe('when user is not known', () => {

      it('should work', done => {
        const newUserId = context.createObjectId.next();

        request(context.app).get(
          `/auth/google/callback?state=${encodeURIComponent(fakeState)}&client_id=${context.env.GOOGLE_ID}&client_secret=${context.env.GOOGLE_SECRET}&code=THISISIT` // eslint-disable-line
        )
          .expect(301)
          .end(err => {
            if(err) {
              return done(err);
            }
            accessTokenCall.done();
            profileCall.done();
            context.db.collection('users').findOne({
              emailKeys: { $all: ['clown@fake.fr'] },
            }).then(user => {
              assert(user, 'User was created!');
              assert.deepEqual(user, {
                _id: newUserId,
                contents: {
                  name: 'Nicolas Froidure',
                  email: 'clown@fake.fr',
                },
                avatar_url: 'https://robohash.org/lol',
                friends_ids: [],
                cars: [],
                auth: {
                  google: {
                    id: '1664',
                    emails: [{
                      type: 'account',
                      value: 'clown@fake.fr',
                    }],
                    accessToken: 'COMMON_BOY',
                    refreshToken: 'COME_AGAIN_MAN',
                  },
                },
                emailKeys: ['clown@fake.fr'],
                rights: [{
                  methods: 127,
                  path: '/api/v0/users/:_id/?.*',
                }, {
                  methods: 7,
                  path: '/api/v0/profile',
                }, {
                  methods: 8,
                  path: '/api/v0/logout',
                }],
              });
              assert.deepEqual(context.bus.trigger.args, [[{
                exchange: 'A_GG_SIGNUP',
                contents: {
                  ip: '::ffff:127.0.0.1',
                  user_id: newUserId,
                },
              }]]);
              done();
            }).catch(done);
          });
      });

    });

    describe('when user is known', () => {

      beforeEach(done => {
        context.db.collection('users').insertOne({
          _id: castToObjectId('abbacacaabbacacaabbacaca'),
          contents: {
            name: 'Popol',
            email: 'popol@moon.u',
          },
          emailKeys: ['popol@moon.u'],
          passwordHash: '$2a$10$s4FQh8WjiYQfx6gdO4AXAePe7tj4HXoo8fIcTsjD6YGkZ/B2oDDpW',
          auth: {
            google: {
              id: '1664',
              accessToken: 'COMMON_BOY',
              refreshToken: 'COME_AGAIN_MAN',
            },
          },
        }, done);
      });

      it('should work', done => {
        request(context.app).get(
          `/auth/google/callback?state=${encodeURIComponent(fakeState)}&client_id=${context.env.GOOGLE_ID}&client_secret=${context.env.GOOGLE_SECRET}&code=THISISIT`
        )
          .expect(301)
          .end(err => {
            if(err) {
              return done(err);
            }
            accessTokenCall.done();
            profileCall.done();
            context.db.collection('users').findOne({
              _id: castToObjectId('abbacacaabbacacaabbacaca'),
            }).then(user => {
              assert(user, 'User was created!');
              assert.deepEqual(user, {
                _id: castToObjectId('abbacacaabbacacaabbacaca'),
                contents: {
                  name: 'Nicolas Froidure',
                  email: 'clown@fake.fr',
                },
                avatar_url: 'https://robohash.org/lol',
                auth: {
                  google: {
                    id: '1664',
                    emails: [{
                      type: 'account',
                      value: 'clown@fake.fr',
                    }],
                    accessToken: 'COMMON_BOY',
                    refreshToken: 'COME_AGAIN_MAN',
                  },
                },
                emailKeys: ['popol@moon.u', 'clown@fake.fr'],
                passwordHash: '$2a$10$s4FQh8WjiYQfx6gdO4AXAePe7tj4HXoo8fIcTsjD6YGkZ/B2oDDpW',
              });
              assert.deepEqual(context.bus.trigger.args, [[{
                exchange: 'A_GG_LOGIN',
                contents: {
                  ip: '::ffff:127.0.0.1',
                  user_id: castToObjectId('abbacacaabbacacaabbacaca'),
                },
              }]]);
              done();
            }).catch(done);
          });
      });

    });

  });

});
