'use strict';

var request = require('supertest');
var express = require('express');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var castToObjectId = require('mongodb').ObjectId;
var sinon = require('sinon');
var assert = require('assert');
var initObjectIdStub = require('objectid-stub');

var initRoutes = require('../../app/routes');

describe('Events endpoints', function() {
  var context;

  before(function(done) {
    context = {};
    context.time = sinon.stub().returns(1664);
    context.env = {
      SESSION_SECRET: 'none',
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
    MongoClient.connect('mongodb://localhost:27017/tripstory_test')
      .then(function(db) {
        context.db = db;
        done();
      });
  });

  before(function(done) {
    context.app = express();
    initRoutes(context);
    done();
  });

  beforeEach(function(done) {
    context.bus = {
      trigger: sinon.spy(),
    };
    done();
  });

  afterEach(function(done) {
    context.db.collection('users').deleteMany({}, done);
  });

  afterEach(function(done) {
    context.db.collection('events').deleteMany({}, done);
  });

  beforeEach(function(done) {
    context.db.collection('users').insertMany([{
      _id: castToObjectId('abbacacaabbacacaabbacaca'),
      contents: {
        name: 'Popol',
        email: 'popol@moon.u',
      },
      emailKeys: ['popol@moon.u'],
      passwordHash: '$2a$10$s4FQh8WjiYQfx6gdO4AXAePe7tj4HXoo8fIcTsjD6YGkZ/B2oDDpW',
      rights: [{
        path: '/api/v0/users/:_id/?.*',
        methods: 127,
      }],
      cars: [{
        _id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
        xeeId: 1664,
        name: 'Opel Meriva',
        brand: 'Opel',
        type: 'xee',
      }],
    }, {
      _id: castToObjectId('babababababababababababa'),
      contents: {
        name: 'Jean Paul Belmondo',
        email: 'jpb@marvello.us',
      },
      emailKeys: ['jpb@marvello.us'],
      passwordHash: '$2a$10$s4FQh8WjiYQfx6gdO4AXAePe7tj4HXoo8fIcTsjD6YGkZ/B2oDDpW',
      rights: [{
        path: '/.*',
        methods: 127,
      }],
      cars: [],
    }], done);
  });

  beforeEach(function(done) {
    context.db.collection('events').insertMany([{
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
        ip: '::ffff:127.0.0.1',
      },
      modified: [{
        seal_date: new Date(context.time()),
        user_id: castToObjectId('abbacacaabbacacaabbacaca'),
        ip: '::ffff:127.0.0.1',
      }],
    }, {
      _id: castToObjectId('bbbbbbbbbbbbbbbbbbbbbbbb'),
      contents: {
        trip_id: castToObjectId('babababababababababababa'),
        type: 'xee-geo',
        geo: [
          50.243942,
          3.0614734,
          41.5,
        ],
        address: '207 Rue Foch, 62860 Rumaucourt, France',
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
        seal_date: new Date(context.time() + 1),
        user_id: castToObjectId('abbacacaabbacacaabbacaca'),
        ip: '::ffff:127.0.0.1',
      },
      modified: [{
        seal_date: new Date(context.time() + 1),
        user_id: castToObjectId('abbacacaabbacacaabbacaca'),
        ip: '::ffff:127.0.0.1',
      }],
    }], done);
  });

  describe('for simple users', function() {

    describe('when the user has no events', function() {

      beforeEach(function(done) {
        context.db.collection('events').deleteMany({
          _id: { $in: [
            castToObjectId('babababababababababababa'),
            castToObjectId('bbbbbbbbbbbbbbbbbbbbbbbb'),
          ] },
        }, done);
      });

      it('should allow to list events', function(done) {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca/events')
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end(function(err, res) {
          assert.deepEqual(res.body, []);
          done(err);
        });
      });

      it('should fail to get an unexisting event', function(done) {
        request(context.app).get(
          '/api/v0/users/abbacacaabbacacaabbacaca/events/b17eb17eb17eb17eb17eb17e'
        )
        .auth('popol@moon.u', 'test')
        .expect(404)
        .end(function(err, res) {
          done(err);
        });
      });

      it('should allow to delete an unexisting event', function(done) {
        request(context.app).delete(
          '/api/v0/users/abbacacaabbacacaabbacaca/events/b17eb17eb17eb17eb17eb17e'
        )
        .auth('popol@moon.u', 'test')
        .expect(410)
        .end(function(err, res) {
          assert.deepEqual(res.body, {});
          done(err);
        });
      });

    });

    describe('when the user has events', function() {

      it('should allow to list events', function(done) {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca/events')
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end(function(err, res) {
          assert.deepEqual(res.body, [{
            _id: 'babababababababababababa',
            contents: {
              trip_id: 'babababababababababababa',
              type: 'trip-start',
            },
            created_date: '1970-01-01T00:00:01.664Z',
          }, {
            _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
            contents: {
              trip_id: 'babababababababababababa',
              type: 'xee-geo',
              geo: [
                50.243942,
                3.0614734,
                41.5,
              ],
              address: '207 Rue Foch, 62860 Rumaucourt, France',
            },
            created_date: '1970-01-01T00:00:01.665Z',
          }]);
          done(err);
        });
      });

      it('should allow to get an event', function(done) {
        request(context.app).get(
          '/api/v0/users/abbacacaabbacacaabbacaca/events/babababababababababababa'
        )
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end(function(err, res) {
          assert.deepEqual(res.body, {
            _id: 'babababababababababababa',
            contents: {
              trip_id: 'babababababababababababa',
              type: 'trip-start',
            },
            created_date: '1970-01-01T00:00:01.664Z',
          });
          done(err);
        });
      });

      it('should fail to delete trip-start event', function(done) {
        request(context.app).delete(
          '/api/v0/users/abbacacaabbacacaabbacaca/events/babababababababababababa'
        )
        .auth('popol@moon.u', 'test')
        .expect(400)
        .end(function(err, res) {
          assert.equal(res.body.code, 'E_UNDELETABLE_EVENT');
          done();
        });
      });

      it('should allow to delete a normal event', function(done) {
        request(context.app).delete(
          '/api/v0/users/abbacacaabbacacaabbacaca/events/bbbbbbbbbbbbbbbbbbbbbbbb'
        )
        .auth('popol@moon.u', 'test')
        .expect(410)
        .end(function(err, res) {
          assert.deepEqual(context.bus.trigger.args, [[{
            exchange: 'A_TRIP_UPDATED',
            contents: {
              trip_id: castToObjectId('babababababababababababa'),
              event_id: castToObjectId('bbbbbbbbbbbbbbbbbbbbbbbb'),
            },
          }]]);
          context.db.collection('events').find({
            _id: castToObjectId('bbbbbbbbbbbbbbbbbbbbbbbb'),
          }).toArray().then(function(events) {
            assert.deepEqual(events, []);
            done(err);
          })
          .catch(done);
        });
      });

      it('should allow to update an event', function(done) {
        request(context.app).put(
          '/api/v0/users/abbacacaabbacacaabbacaca/events/bbbbbbbbbbbbbbbbbbbbbbbb'
        )
        .auth('popol@moon.u', 'test')
        .send({
          _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
          contents: {
            trip_id: 'babababababababababababa',
            type: 'xee-geo',
            geo: [
              60.243942,
              9.0614734,
              20.5,
            ],
            address: '',
          },
        })
        .expect(201)
        .end(function(err, res) {
            assert.deepEqual(context.bus.trigger.args, [[{
              exchange: 'A_TRIP_UPDATED',
              contents: {
                trip_id: castToObjectId('babababababababababababa'),
                event_id: castToObjectId('bbbbbbbbbbbbbbbbbbbbbbbb'),
              },
            }]]);
            context.db.collection('events').findOne({
              _id: castToObjectId('bbbbbbbbbbbbbbbbbbbbbbbb'),
            }).then(function(event) {
              assert.deepEqual(event, {
                _id: castToObjectId('bbbbbbbbbbbbbbbbbbbbbbbb'),
                contents: {
                  trip_id: castToObjectId('babababababababababababa'),
                  type: 'xee-geo',
                  geo: [
                    60.243942,
                    9.0614734,
                    20.5,
                  ],
                  address: '',
                },
                owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
                trip: {
                  friends_ids: [],
                  description: 'Lol',
                  hash: 'lol',
                  title: 'Lol',
                  car_id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
                },
                created: {
                  seal_date: new Date(context.time() + 1),
                  user_id: castToObjectId('abbacacaabbacacaabbacaca'),
                  ip: '::ffff:127.0.0.1',
                },
                modified: [{
                  seal_date: new Date(context.time() + 1),
                  user_id: castToObjectId('abbacacaabbacacaabbacaca'),
                  ip: '::ffff:127.0.0.1',
                }, {
                  seal_date: new Date(context.time()),
                  user_id: castToObjectId('abbacacaabbacacaabbacaca'),
                  ip: '::ffff:127.0.0.1',
                }],
              });
              done(err);
            })
            .catch(done);
        });
      });

    });

    it('should allow to create an event', function(done) {
      request(context.app).put(
        '/api/v0/users/abbacacaabbacacaabbacaca/events/b0b0b0b0b0b0b0b0b0b0b0b0'
      )
      .auth('popol@moon.u', 'test')
      .send({
        _id: 'b0b0b0b0b0b0b0b0b0b0b0b0',
        contents: {
          trip_id: 'babababababababababababa',
          type: 'xee-geo',
          geo: [
            60.243942,
            9.0614734,
            20.5,
          ],
          address: '',
        },
      })
      .expect(201)
      .end(function(err, res) {
          assert.deepEqual(context.bus.trigger.args, [[{
            exchange: 'A_TRIP_UPDATED',
            contents: {
              trip_id: castToObjectId('babababababababababababa'),
              event_id: castToObjectId('b0b0b0b0b0b0b0b0b0b0b0b0'),
            },
          }]]);
          context.db.collection('events').findOne({
            _id: castToObjectId('b0b0b0b0b0b0b0b0b0b0b0b0'),
          }).then(function(event) {
            assert.deepEqual(event, {
              _id: castToObjectId('b0b0b0b0b0b0b0b0b0b0b0b0'),
              contents: {
                trip_id: castToObjectId('babababababababababababa'),
                type: 'xee-geo',
                geo: [
                  60.243942,
                  9.0614734,
                  20.5,
                ],
                address: '',
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
                ip: '::ffff:127.0.0.1',
              },
              modified: [{
                seal_date: new Date(context.time()),
                user_id: castToObjectId('abbacacaabbacacaabbacaca'),
                ip: '::ffff:127.0.0.1',
              }],
            });
            done(err);
          })
          .catch(done);
      });

    });

    it('should fail to create a start event', function(done) {
      request(context.app).put(
        '/api/v0/users/abbacacaabbacacaabbacaca/events/b0b0b0b0b0b0b0b0b0b0b0b0'
      )
      .auth('popol@moon.u', 'test')
      .send({
        _id: 'b0b0b0b0b0b0b0b0b0b0b0b0',
        contents: {
          trip_id: 'babababababababababababa',
          type: 'trip-start',
        },
      })
      .expect(400)
      .end(function(err, res) {
        assert.equal(res.body.code, 'E_UNCREATABLE_EVENT');
        done();
      });

    });

  });

  describe('for root users', function() {

    it('should allow to get all trips', function(done) {
      request(context.app).get('/api/v0/trips')
      .auth('jpb@marvello.us', 'test')
      .expect(200)
      .end(function(err, res) {
        assert.deepEqual(res.body, [{
          _id: 'babababababababababababa',
          contents: {
            car_id: 'b17eb17eb17eb17eb17eb17e',
            description: 'Lol',
            friends_ids: [],
            hash: 'lol',
            title: 'Lol',
          },
          created_date: '1970-01-01T00:00:01.664Z',
        }]);
        done(err);
      });
    });

  });

});