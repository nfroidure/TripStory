'use strict';

var MongoClient = require('mongodb').MongoClient;
var castToObjectId = require('mongodb').ObjectId;
var sinon = require('sinon');
var assert = require('assert');
var nock = require('nock');
var initObjectIdStub = require('objectid-stub');

var xeeJobs = require('../../workers/xee/xee.jobs.js');

describe('Xee jobs', function() {
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
        xee: {
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
        xee: {
          id: '10153532201272839',
          accessToken: 'COMMON_BOY',
          refreshToken: null,
        },
      },
    }], done);
  });

  describe('for Xee cars sync', function() {
    var carsCall;
    var newCarId;

    beforeEach(function() {
      newCarId = context.createObjectId.next();
      carsCall = nock('https://cloud.xee.com:443', {
        encodedQueryParams: true,
      })
      .get('/v1/user/1664/car.json')
      .query({
        access_token: 'COMMON_BOY',
      })
      .reply(200, [{
        id: 2321,
        name: 'Opel Meriva',
        brand: 'Opel',
        model: 'Astra',
        year: 0,
        plateNumber: '',
        cardbId: 79,
      }], {
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'close',
        'cache-control': 'no-cache',
        date: 'Sat, 06 Feb 2016 12:09:14 GMT',
      });
    });

    ['A_XEE_SIGNUP', 'A_XEE_LOGIN'].forEach(function(exchange) {
      it('should retrieve cars', function(done) {
        xeeJobs[exchange](context, {
          exchange: exchange,
          contents: {
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
          },
        })
        .then(function() {
          carsCall.done();
          return context.db.collection('users').findOne({
            _id: castToObjectId('abbacacaabbacacaabbacaca'),
          }).then(function(user) {
            assert.deepEqual(user.cars, [{
              _id: newCarId,
              xeeId: 2321,
              name: 'Opel Meriva',
              brand: 'Opel',
              type: 'xee',
            }]);
          });
        })
        .then(done.bind(null, null))
        .catch(done);
      });
    });

  });

});
