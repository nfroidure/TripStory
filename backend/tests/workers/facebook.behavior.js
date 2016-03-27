'use strict';

var MongoClient = require('mongodb').MongoClient;
var castToObjectId = require('mongodb').ObjectId;
var sinon = require('sinon');
var assert = require('assert');
var nock = require('nock');
var initObjectIdStub = require('objectid-stub');

var facebookJobs = require('../../workers/facebook/facebook.jobs.js');

describe('Facebook jobs', function() {
  var context;

  before(function(done) {
    context = {};
    context.time = sinon.stub().returns(1664);
    context.env = {
      EMAIL: 'mailer-daemon@cloud',
      PORT: '3000',
    };
    context.base = 'http://localhost/';
    context.logger = {
      error: sinon.spy(),
      debug: sinon.spy(),
      info: sinon.spy(),
    };
    context.createObjectId = initObjectIdStub({
      ctor: castToObjectId,
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
        facebook: {
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
        facebook: {
          id: '10153532201272839',
          accessToken: 'COMMON_BOY',
          refreshToken: null,
        },
      },
    }], done);
  });

  describe('for Facebook friends sync', function() {
    var friendsCall;

    beforeEach(function() {
      friendsCall = nock('https://graph.facebook.com:443', {
        encodedQueryParams: true,
      })
      .get('/1664/friends')
      .query({ access_token: 'COMMON_BOY' })
      .reply(200, {
        data: [{
          name: 'Jean De La Fontaine',
          id: '10153532201272839',
        }, {
          name: 'Victor Hugo',
          id: '10153874940679789',
        }],
        paging: {
          next: 'https://graph.facebook.com/v2.5/10153768131704201/friends',
        },
        summary: {
          total_count: 189,
        },
      }, {
        'access-control-allow-origin': '*',
        'content-type': 'text/javascript; charset=UTF-8',
        'x-fb-trace-id': 'FJgxiLd+P4g',
        'x-fb-rev': '2168097',
        etag: '"0483d18750c66dbbaae0810e280e05ef50358008"',
        pragma: 'no-cache',
        'cache-control': 'private, no-cache, no-store, must-revalidate',
        'facebook-api-version': 'v2.5',
        expires: 'Sat, 01 Jan 2000 00:00:00 GMT',
        vary: 'Accept-Encoding',
        date: 'Sat, 06 Feb 2016 10:01:53 GMT',
        connection: 'close',
      });
    });


    ['A_FB_SIGNUP', 'A_FB_LOGIN'].forEach(function(exchange) {
      it('should pair friends', function(done) {
        facebookJobs[exchange](context, {
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
