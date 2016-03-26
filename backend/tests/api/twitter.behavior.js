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

describe('OAuth Twitter endpoints', function() {
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
      TWITTER_ID: '123-456-789',
      TWITTER_SECRET: 'shhh-its-a-secret',
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

  afterEach(function(done) {
    context.db.collection('sessions').deleteMany({}, done);
  });

  describe('entry point', function() {
    var requestTokenCall;

    beforeEach(function() {
        requestTokenCall = nock('https://api.twitter.com:443', {
          encodedQueryParams: true,
        })
        .post(
          '/oauth/request_token'
        )
        .reply(
          200,
          'oauth_token=YOP' +
          '&oauth_token_secret=POY' +
          '&oauth_callback_confirmed=true', {
            'content-type': 'text/plain; charset=UTF-8',
          });
    });

    it('should redirect to the OAuth page', function(done) {
      request(context.app).get('/auth/twitter')
        .expect(302)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          requestTokenCall.done();
          assert(context.tokens.createToken.callCount, 1);
          assert.equal(
            res.headers.location,
            'https://api.twitter.com/oauth/authenticate?oauth_token=YOP'
          );
          done();
        });
    });

  });

  describe('callback endpoint', function() {
    var accessTokenCall;
    var profileCall;

    beforeEach(function(done) {
      context.db.collection('sessions').insertOne({
        _id: 'x6L9CiWPF1pD4bIFyCFvV--sg7H2znNj',
        session: JSON.stringify({
          cookie: {
            originalMaxAge: null,
            expires: null,
            httpOnly: true,
            path: '/',
          },
          'oauth:twitter': {
            oauth_token: 'YOP',
            oauth_token_secret: 'POY',
          },
        }),
      }, done);
    });

    beforeEach(function() {
      accessTokenCall = nock('https://api.twitter.com:443', {
        encodedQueryParams: true,
      })
      .post(
        '/oauth/access_token'
      )
      .reply(
        200,
        'oauth_token=COMMON_BOY' +
        '&oauth_token_secret=COME_AGAIN_MAN' +
        '&user_id=1664' +
        '&screen_name=nfroidure' +
        '&x_auth_expires=0', {
          'content-type': 'text/plain; charset=UTF-8',
        });

      profileCall = nock('https://api.twitter.com:443', {
        encodedQueryParams: true,
      })
      .get('/1.1/users/show.json')
      .query({
        user_id: '1664',
      })
      .reply(200, {
        "id": 1664,
        "id_str": "1664",
        "name": "Nicolas Froidure",
        "screen_name": "nfroidure",
        "location": "Lille, France.",
        "profile_location": null,
        "description": "Full-stack JavaScript developer @SimpliField, NodeJS early user, NPM flooder, GitHub fan.",
        "url": "http://t.co/VYWWEzqULI",
        "protected": false,
        "followers_count": 1055,
        "friends_count": 393,
        "listed_count": 134,
        "created_at": "Wed Jul 15 12:44:38 +0000 2009",
        "favourites_count": 306,
        "utc_offset": 3600,
        "time_zone": "Paris",
        "geo_enabled": true,
        "verified": false,
        "statuses_count": 9300,
        "lang": "fr",
        "contributors_enabled": false,
        "is_translator": false,
        "is_translation_enabled": false,
        "profile_background_color": "008000",
        "profile_background_image_url": "http://pbs.twimg.com/profile_background_images/718389880/1eaccd03f55b56fd0d9ecb12d6115193.png",
        "profile_background_image_url_https": "https://pbs.twimg.com/profile_background_images/718389880/1eaccd03f55b56fd0d9ecb12d6115193.png",
        "profile_background_tile": false,
        "profile_image_url": "http://robohash.org/lol",
        "profile_image_url_https": "https://robohash.org/lol",
        "profile_link_color": "0099CC",
        "profile_sidebar_border_color": "FFFFFF",
        "profile_sidebar_fill_color": "DDEEF6",
        "profile_text_color": "333333",
        "profile_use_background_image": true,
        "has_extended_profile": true,
        "default_profile": false,
        "default_profile_image": false,
        "following": false,
        "follow_request_sent": false,
        "notifications": false,
        "suspended": false,
        "needs_phone_verification": false
      }, {
        'content-type': 'text/javascript; charset=UTF-8',
      });
    });

    describe('when user is not known', function() {

      it('should work', function(done) {
        var newUserId = context.createObjectId.next();

        request(context.app).get(
          '/auth/twitter/callback' +
          '?state=' + encodeURIComponent(fakeState) +
          '&oauth_token=YOP' +
          '&oauth_verifier=POY'
        )
          .set('Cookie', 'connect.sid=s%3Ax6L9CiWPF1pD4bIFyCFvV--sg7H2znNj.4eX1VfudnVnDiwRDUy0G0%2FeiG05doSmwDp5EUOEYcS0')
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
                  photo: 'https://robohash.org/lol',
                },
                auth: {
                  twitter: {
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
            twitter: {
              id: '1664',
              accessToken: 'COMMON_BOY',
              refreshToken: 'COME_AGAIN_MAN',
            },
          },
        }, done);
      });

      it('should work', function(done) {
        request(context.app).get(
          '/auth/twitter/callback' +
          '?state=' + encodeURIComponent(fakeState) +
          '&oauth_token=YOP' +
          '&oauth_verifier=POY'
        )
          .set('Cookie', 'connect.sid=s%3Ax6L9CiWPF1pD4bIFyCFvV--sg7H2znNj.4eX1VfudnVnDiwRDUy0G0%2FeiG05doSmwDp5EUOEYcS0')
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
                  name: 'Nicolas Froidure',
                  photo: 'https://robohash.org/lol',
                  email: 'popol@moon.u',
                },
                auth: {
                  twitter: {
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
