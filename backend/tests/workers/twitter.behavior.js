'use strict';

var MongoClient = require('mongodb').MongoClient;
var castToObjectId = require('mongodb').ObjectId;
var sinon = require('sinon');
var assert = require('assert');
var nock = require('nock');
var Twitter = require('twitter');
var initObjectIdStub = require('objectid-stub');

var twitterJobs = require('../../workers/twitter/twitter.jobs.js');

describe('Twitter jobs', function() {
  var context;

  before(function(done) {
    context = {};
    context.time = sinon.stub().returns(1664);
    context.env = {};
    context.base = 'http://localhost/';
    context.logger = {
      error: sinon.spy(),
      debug: sinon.spy(),
      info: sinon.spy(),
    };
    context.createObjectId = initObjectIdStub({
      ctor: castToObjectId,
    });
    context.twitter = new Twitter({
      consumer_key: 'process.env.TWITTER_ID',
      consumer_secret: 'process.env.TWITTER_SECRET',
      access_token_key: 'process.env.TWITTER_ACCESS_TOKEN',
      access_token_secret: 'process.env.TWITTER_ACCESS_TOKEN_SECRET',
    });
    MongoClient.connect('mongodb://localhost:27017/tripstory_test')
      .then(function(db) {
        context.db = db;
        done();
      });
  });

  afterEach(function(done) {
    context.db.collection('users').deleteMany({}, done);
  });

  beforeEach(function(done) {
    context.db.collection('users').insertMany([{
      _id: castToObjectId('abbacacaabbacacaabbacaca'),
      contents: {
        name: 'Popol',
        email: 'popol@moon.u',
      },
      emailKeys: ['popol@moon.u'],
      friends_ids: [],
      auth: {
        twitter: {
          id: '1664',
          accessToken: 'COMMON_BOY',
          refreshToken: null,
        },
      },
    }, {
      _id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
      contents: {
        name: 'Jean De La Fontaine',
        email: 'jdlf@academie.fr',
      },
      emailKeys: ['popol@moon.u'],
      friends_ids: [],
      auth: {
        twitter: {
          id: '2432',
          accessToken: 'COMMON_BOY',
          refreshToken: null,
        },
      },
    }], done);
  });

  describe('for Twitter friends sync', function() {
    var friendsCall;

    beforeEach(function() {
      friendsCall =
      nock('https://api.twitter.com:443', {
        encodedQueryParams: true
      })
      .get('/1.1/friends/ids.json')
      .reply(200, {
        ids: [1024, 2432, 416],
        next_cursor: 0,
        next_cursor_str: '0',
        previous_cursor: 0,
        previous_cursor_str: '0'
      }, {
        'content-disposition': 'attachment; filename=json.json',
        'content-length': '3773',
        'content-type': 'application/json;charset=utf-8',
        date: 'Mon, 28 Mar 2016 20:34:26 GMT',
        expires: 'Tue, 31 Mar 1981 05:00:00 GMT',
        'last-modified': 'Mon, 28 Mar 2016 20:34:26 GMT',
        pragma: 'no-cache',
        status: '200 OK',
        'strict-transport-security': 'max-age=631138519',
        'x-access-level': 'read',
        'x-connection-hash': '26061a6785a1b73424040ead52e98fc8',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'x-rate-limit-limit': '15',
        'x-rate-limit-remaining': '14',
        'x-rate-limit-reset': '1459198166',
        'x-response-time': '124',
        'x-transaction': '7f121cfbac00e2d9',
        'x-twitter-response-tags': 'BouncerCompliant',
        'x-xss-protection': '1; mode=block',
      });

    });

    ['A_TWITTER_SIGNUP', 'A_TWITTER_LOGIN'].forEach(function(exchange) {
      it('should pair friends', function(done) {
        twitterJobs[exchange](context, {
          exchange: exchange,
          contents: {
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
          },
        })
        .then(function() {
          friendsCall.done();
          return context.db.collection('users').findOne({
            _id: castToObjectId('abbacacaabbacacaabbacaca'),
          }).then(function(user) {
            assert.deepEqual(user.friends_ids, [
              castToObjectId('b17eb17eb17eb17eb17eb17e'),
            ]);
          });
        })
        .then(done.bind(null, null))
        .catch(done);
      });
    });

  });

});
