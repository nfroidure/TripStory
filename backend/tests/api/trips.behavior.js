'use strict';

const request = require('supertest');
const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const castToObjectId = require('mongodb').ObjectId;
const sinon = require('sinon');
const assert = require('assert');
const initObjectIdStub = require('objectid-stub');
const passport = require('passport');

const initRoutes = require('../../app/routes');

describe('Trips endpoints', () => {
  let context;

  before(done => {
    context = {
      env: { NODE_ENV: 'development' },
    };
    context.env.SESSION_SECRET = 'none';
    context.env.STATIC_PATH = path.join(__dirname, '..', '..', '..', 'mobile', 'www');
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

  afterEach(done => {
    context.db.collection('events').deleteMany({}, done);
  });

  beforeEach(done => {
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

  beforeEach(done => {
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
        ip: '::ffff:127.0.0.1',
      },
      modified: [{
        seal_date: new Date(context.time()),
        user_id: castToObjectId('abbacacaabbacacaabbacaca'),
        ip: '::ffff:127.0.0.1',
      }],
    }, done);
  });

  describe('for simple users', () => {

    describe('when the user has no trips', () => {

      beforeEach(done => {
        context.db.collection('events').deleteOne({
          _id: castToObjectId('babababababababababababa'),
        }, done);
      });

      it('should allow to list trips', done => {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca/trips')
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, []);
          done();
        });
      });

      it('should fail to get an unexisting trip', done => {
        request(context.app).get(
          '/api/v0/users/abbacacaabbacacaabbacaca/trips/b17eb17eb17eb17eb17eb17e'
        )
        .auth('popol@moon.u', 'test')
        .expect(410)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          done();
        });
      });

      it('should allow to delete an unexisting trip', done => {
        request(context.app).delete(
          '/api/v0/users/abbacacaabbacacaabbacaca/trips/b17eb17eb17eb17eb17eb17e'
        )
        .auth('popol@moon.u', 'test')
        .expect(410)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, {});
          done();
        });
      });

    });

    describe('when the user has trips', () => {

      it('should allow to list trips', done => {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca/trips')
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, [{
            _id: 'babababababababababababa',
            contents: {
              car_id: 'b17eb17eb17eb17eb17eb17e',
              description: 'Lol',
              friends_ids: [],
              hash: 'lol',
              title: 'Lol',
            },
            owner_id: 'abbacacaabbacacaabbacaca',
            created_date: '1970-01-01T00:00:01.664Z',
          }]);
          done();
        });
      });

      it('should allow to get a trip', done => {
        request(context.app).get(
          '/api/v0/users/abbacacaabbacacaabbacaca/trips/babababababababababababa'
        )
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, {
            _id: 'babababababababababababa',
            contents: {
              car_id: 'b17eb17eb17eb17eb17eb17e',
              description: 'Lol',
              friends_ids: [],
              hash: 'lol',
              title: 'Lol',
            },
            owner_id: 'abbacacaabbacacaabbacaca',
            events: [{
              _id: 'babababababababababababa',
              contents: {
                type: 'trip-start',
                trip_id: 'babababababababababababa',
              },
              created_date: '1970-01-01T00:00:01.664Z',
            }],
            users: {
              abbacacaabbacacaabbacaca: {
                _id: 'abbacacaabbacacaabbacaca',
                contents: {
                  email: 'popol@moon.u',
                  name: 'Popol',
                },
              },
            },
            created_date: '1970-01-01T00:00:01.664Z',
          });
          done();
        });
      });

      it('should allow to delete a trip', done => {
        request(context.app).delete(
          '/api/v0/users/abbacacaabbacacaabbacaca/trips/babababababababababababa'
        )
        .auth('popol@moon.u', 'test')
        .expect(410)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(context.bus.trigger.args, [[{
            exchange: 'A_TRIP_DELETED',
            contents: {
              trip_id: castToObjectId('babababababababababababa'),
              users_ids: [castToObjectId('abbacacaabbacacaabbacaca')],
            },
          }]]);
          context.db.collection('events').find({
            _id: castToObjectId('babababababababababababa'),
          }).toArray().then(events => {
            assert.deepEqual(events, []);
            done(err);
          })
          .catch(done);
        });
      });

      describe('for non owned trips', () => {

        beforeEach(done => {
          context.db.collection('events').updateOne({
            _id: castToObjectId('babababababababababababa'),
          }, {
            $set: {
              'trip.friends_ids': [castToObjectId('abbacacaabbacacaabbacaca')],
              owner_id: castToObjectId('b0b0b0b0b0b0b0b0b0b0b0b0'),
            },
          }, done);
        });

        it('should allow to leave that trip', done => {
          request(context.app).delete(
            '/api/v0/users/abbacacaabbacacaabbacaca/trips/babababababababababababa'
          )
          .auth('popol@moon.u', 'test')
          .expect(410)
          .end((err, res) => {
            if(err) {
              return done(err);
            }
            assert.deepEqual(context.bus.trigger.args, [[{
              exchange: 'A_TRIP_LEFT',
              contents: {
                trip_id: castToObjectId('babababababababababababa'),
                user_id: castToObjectId('abbacacaabbacacaabbacaca'),
                users_ids: [castToObjectId('b0b0b0b0b0b0b0b0b0b0b0b0')],
              },
            }]]);
            context.db.collection('events').findOne({
              _id: castToObjectId('babababababababababababa'),
            }).then(event => {
              assert.deepEqual(event.trip.friends_ids, []);
              done(err);
            })
            .catch(done);
          });
        });

      });

      it('should allow to update a trip', done => {
        request(context.app).put(
          '/api/v0/users/abbacacaabbacacaabbacaca/trips/babababababababababababa'
        )
        .auth('popol@moon.u', 'test')
        .send({
          _id: 'babababababababababababa',
          contents: {
            car_id: 'b17eb17eb17eb17eb17eb17e',
            description: 'Kikooooolol',
            friends_ids: [],
            hash: 'kikooooolol',
            title: 'Kikooooolol',
          },
        })
        .expect(201)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(context.bus.trigger.args, [[{
            exchange: 'A_TRIP_UPDATED',
            contents: {
              trip_id: castToObjectId('babababababababababababa'),
              users_ids: [castToObjectId('abbacacaabbacacaabbacaca')],
            },
          }]]);
          context.db.collection('events').findOne({
            _id: castToObjectId('babababababababababababa'),
          }).then(event => {
            assert.deepEqual(event, {
              _id: castToObjectId('babababababababababababa'),
              contents: {
                trip_id: castToObjectId('babababababababababababa'),
                type: 'trip-start',
              },
              owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
              trip: {
                friends_ids: [],
                description: 'Kikooooolol',
                hash: 'kikooooolol',
                title: 'Kikooooolol',
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

    it('should allow to create a trip', done => {
      request(context.app).put(
        '/api/v0/users/abbacacaabbacacaabbacaca/trips/b0b0b0b0b0b0b0b0b0b0b0b0'
      )
      .auth('popol@moon.u', 'test')
      .send({
        _id: 'b0b0b0b0b0b0b0b0b0b0b0b0',
        contents: {
          car_id: 'b17eb17eb17eb17eb17eb17e',
          description: 'Lol',
          friends_ids: [],
          hash: 'lol',
          title: 'Lol',
        },
      })
      .expect(201)
      .end((err, res) => {
        if(err) {
          return done(err);
        }
        assert.deepEqual(context.bus.trigger.args, [[{
          exchange: 'A_TRIP_CREATED',
          contents: {
            trip_id: castToObjectId('b0b0b0b0b0b0b0b0b0b0b0b0'),
            users_ids: [castToObjectId('abbacacaabbacacaabbacaca')],
          },
        }]]);
        context.db.collection('events').findOne({
          _id: castToObjectId('b0b0b0b0b0b0b0b0b0b0b0b0'),
        }).then(event => {
          assert.deepEqual(event, {
            _id: castToObjectId('b0b0b0b0b0b0b0b0b0b0b0b0'),
            contents: {
              trip_id: castToObjectId('b0b0b0b0b0b0b0b0b0b0b0b0'),
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
          });
          done(err);
        })
        .catch(done);
      });
    });

  });

  describe('for root users', () => {

    it('should allow to get all trips', done => {
      request(context.app).get('/api/v0/trips')
      .auth('jpb@marvello.us', 'test')
      .expect(200)
      .end((err, res) => {
        if(err) {
          return done(err);
        }
        assert.deepEqual(res.body, [{
          _id: 'babababababababababababa',
          contents: {
            car_id: 'b17eb17eb17eb17eb17eb17e',
            description: 'Lol',
            friends_ids: [],
            hash: 'lol',
            title: 'Lol',
          },
          owner_id: 'abbacacaabbacacaabbacaca',
          created_date: '1970-01-01T00:00:01.664Z',
        }]);
        done(err);
      });
    });

  });

});
