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
    context.createObjectId.reset();
    done();
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

  describe('for Xee positions sync', function() {
    var exchange = 'A_XEE_SYNC';

    describe('when there are no trip', function() {

      it('should do nothing', function(done) {
        xeeJobs[exchange](context, {
          exchange: exchange,
          contents: {
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
          },
        })
        .then(function() {
          return context.db.collection('events').count({})
          .then(function(count) {
            assert.equal(count, 0);
          })
          .then(done.bind(null, null))
          .catch(done);
        });

      });

    });

    describe('when there are runnng trips', function() {
      var positionCall;
      var newEventId;

      beforeEach(function() {
        newEventId = context.createObjectId.next();
        positionCall = nock('https://cloud.xee.com:443', {
          encodedQueryParams: true,
        })
        .get('/v1/car/1664/carstatus.json')
        .query({
          access_token: 'COMMON_BOY',
        })
        .reply(200, {
          accelerometer: {
            id: '0',
            x: -8,
            y: 0,
            z: 0,
            date: '2016-03-28 08:29:03',
            driverId: null,
          },
          location: {
            id: '0',
            date: '2016-03-28 08:44:53',
            longitude: 3.0614734,
            latitude: 50.243942,
            altitude: 41.5,
            nbSat: 8,
            driverId: null,
            heading: 172.32,
          },
          signals: [{
            id: '0',
            name: 'IgnitionSts',
            reportDate: '2016-03-28 08:43:53',
            value: '0',
            driverId: null,
          }, {
            id: '0',
            name: 'VehiculeSpeed',
            reportDate: '2016-03-28 08:43:33',
            value: '0',
            driverId: null,
          }],
        }, {
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
          connection: 'close',
          'cache-control': 'no-cache',
          date: 'Sat, 06 Feb 2016 12:09:14 GMT',
        });
      });

      beforeEach(function(done) {
        context.db.collection('users').updateOne({
          _id: castToObjectId('abbacacaabbacacaabbacaca'),
        }, {
          $set: {
            cars: [{
              _id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
              xeeId: 1664,
              name: 'Opel Meriva',
              brand: 'Opel',
              type: 'xee',
            }],
          },
        }, done);
      });

      beforeEach(function(done) {
        context.db.collection('events').insertOne({
          _id: castToObjectId('babababababababababababa'),
          contents: {
            trip_id: castToObjectId('babababababababababababa'),
            type: 'trip-start',
          },
          owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
          trip: {
            friends_ids: [],
            title: 'Lol',
            description: 'Lol',
            hash: 'lol',
            car_id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
          },
          created: {
            seal_date: new Date(context.time()),
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
            ip: '::1',
          },
          modified: [{
            seal_date: new Date(context.time()),
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
            ip: '::1',
          }],
        }, done);
      });

      it('should retrieve position', function(done) {
        xeeJobs[exchange](context, {
          exchange: exchange,
          contents: {
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
          },
        })
        .then(function() {
          positionCall.done();
          return context.db.collection('events').findOne({
            _id: newEventId,
          }).then(function(event) {
            assert.deepEqual(event, {
              _id: newEventId,
              contents: {
                trip_id: castToObjectId('babababababababababababa'),
                type: 'xee-geo',
                geo: [
                  50.243942,
                  3.0614734,
                  41.5,
                ],
              },
              trip: {
                friends_ids: [],
                title: 'Lol',
                description: 'Lol',
                hash: 'lol',
                car_id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
              },
              owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
              created: {
                seal_date: new Date('2016-03-28T06:44:53.000Z'),
              },
            });
          });
        })
        .then(done.bind(null, null))
        .catch(done);
      });

    });

  });

});
