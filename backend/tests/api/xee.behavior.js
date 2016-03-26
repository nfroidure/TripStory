'use strict';

var request = require('supertest');
var express = require('express');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var castToObjectId = require('mongodb').ObjectId;
var sinon = require('sinon');
var assert = require('assert');
var nock = require('nock');
var initObjectIdStub = require('objectid-stub');

var initRoutes = require('../../app/routes');

describe('OAuth XEE endpoints', function() {
  var context;
  var fakeState = new Buffer(JSON.stringify({
    contents: { fake: 'token' },
  })).toString('base64');

  before(function(done) {
    context = {};
    context.tokens = {
      createToken: sinon.stub().returns({
        contents: { fake: 'token' },
      }),
      checkToken: sinon.stub().returns(true),
    };
    context.time = sinon.stub().returns(1664);
    context.env = {
      SESSION_SECRET: 'none',
      XEE_ID: '123-456-789',
      XEE_SECRET: 'shhh-its-a-secret',
      mobile_path: path.join(__dirname, '..', '..', '..', 'mobile', 'www'),
    };
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
      .then(function(db) {
        context.db = db;
        done();
      });
    context.bus = {
      trigger: sinon.spy(),
    };
  });

  before(function(done) {
    context.app = express();
    initRoutes(context);
    done();
  });

  afterEach(function(done) {
    context.db.collection('users').deleteMany({}, done);
  });

  describe('entry point', function() {

    it('should redirect to the OAuth page', function(done) {
      request(context.app).get('/auth/xee')
        .expect(302)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          assert(context.tokens.createToken.callCount, 1);
          assert.equal(
            res.headers.location,
            'https://cloud.xee.com/v1/auth/auth' +
            '?response_type=code' +
            '&redirect_uri=' + encodeURIComponent(
              context.base + '/auth/xee/callback'
            ) +
            '&scope=user_get%20email_get%20car_get%20data_get%20' +
              'location_get%20address_all%20accelerometer_get' +
            '&state=' + encodeURIComponent(fakeState) +
            '&client_id=' + context.env.XEE_ID
          );
          done();
        });
    });

  });

  describe('callback endpoint', function() {
    var accessTokenCall;
    var profileCall;

    beforeEach(function() {
      accessTokenCall = nock('https://cloud.xee.com:443', {
        encodedQueryParams: true,
      })
      .post(
        '/v1/auth/access_token.json',
        'grant_type=authorization_code' +
        '&redirect_uri=' + encodeURIComponent(
          context.base + '/auth/xee/callback'
        ) +
        '&client_id=' + context.env.XEE_ID +
        '&client_secret=' + context.env.XEE_SECRET +
        '&code=THISISIT'
      )
      .basicAuth({
        user: context.env.XEE_ID,
        pass: context.env.XEE_SECRET,
      })
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


      profileCall = nock('https://cloud.xee.com:443', {
        encodedQueryParams: true,
      })
      .get('/v1/user/me.json')
      .query({
        access_token: 'COMMON_BOY',
      })
      .reply(200, {
        id: 1664,
        name: 'Froidure',
        firstName: 'Nicolas',
        gender: 1,
        nickName: '',
        role: 'dev',
        birthDate: '2015-11-22',
        licenseDeliveryDate: null,
      }, {
        'content-type': 'text/javascript; charset=UTF-8',
      });
    });

    describe('when user is not known', function() {

      it('should work', function(done) {
        var newUserId = context.createObjectId.next();

        request(context.app).get(
          '/auth/xee/callback' +
          '?state=' + encodeURIComponent(fakeState) +
          '&client_id=' + context.env.XEE_ID +
          '&client_secret=' + context.env.XEE_SECRET +
          '&code=THISISIT' // eslint-disable-line
        )
          .expect(301)
          .end(function(err, res) {
            if(err) {
              return done(err);
            }
            accessTokenCall.done();
            profileCall.done();
            context.db.collection('users').findOne({
              'contents.name': 'Nicolas Froidure',
            }).then(function(user) {
              assert(user, 'User was created!');
              assert.deepEqual(user, {
                _id: newUserId,
                contents: {
                  name: 'Nicolas Froidure',
                },
                auth: {
                  xee: {
                    id: '1664',
                    accessToken: 'COMMON_BOY',
                    refreshToken: 'COME_AGAIN_MAN',
                  },
                },
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
              done();
            }).catch(done);
          });
      });

    });

    describe('when user is known', function() {

      beforeEach(function(done) {
        context.db.collection('users').insertOne({
          _id: castToObjectId('abbacacaabbacacaabbacaca'),
          contents: {
            name: 'Popol',
            email: 'popol@moon.u',
          },
          emailKeys: ['popol@moon.u'],
          passwordHash: '$2a$10$s4FQh8WjiYQfx6gdO4AXAePe7tj4HXoo8fIcTsjD6YGkZ/B2oDDpW',
          auth: {
            xee: {
              id: '1664',
              accessToken: 'COMMON_BOY',
              refreshToken: 'COME_AGAIN_MAN',
            },
          },
        }, done);
      });

      it('should work', function(done) {
        request(context.app).get(
          '/auth/xee/callback' +
          '?state=' + encodeURIComponent(fakeState) +
          '&client_id=' + context.env.XEE_ID +
          '&client_secret=' + context.env.XEE_SECRET +
          '&code=THISISIT'
        )
          .expect(301)
          .end(function(err) {
            if(err) {
              return done(err);
            }
            accessTokenCall.done();
            profileCall.done();
            context.db.collection('users').findOne({
              _id: castToObjectId('abbacacaabbacacaabbacaca'),
            }).then(function(user) {
              assert(user, 'User was created!');
              assert.deepEqual(user, {
                _id: castToObjectId('abbacacaabbacacaabbacaca'),
                contents: {
                  name: 'Popol',
                  email: 'popol@moon.u',
                },
                auth: {
                  xee: {
                    id: '1664',
                    accessToken: 'COMMON_BOY',
                    refreshToken: 'COME_AGAIN_MAN',
                  },
                },
                emailKeys: ['popol@moon.u'],
                passwordHash: '$2a$10$s4FQh8WjiYQfx6gdO4AXAePe7tj4HXoo8fIcTsjD6YGkZ/B2oDDpW',
              });
              done();
            }).catch(done);
          });
      });

    });

  });

});
