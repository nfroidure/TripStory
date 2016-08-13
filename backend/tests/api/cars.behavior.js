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

describe('Cars endpoints', () => {
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
      cars: [{
        _id: castToObjectId('b0b0b0b0b0b0b0b0b0b0b0b0'),
        xeeId: 2432,
        name: 'Citroën Traction',
        brand: 'Citroën',
        type: 'xee',
      }],
    }], done);
  });

  describe('for simple users', () => {

    describe('when the user has no cars', () => {

      beforeEach(done => {
        context.db.collection('users').updateOne({
          _id: castToObjectId('abbacacaabbacacaabbacaca'),
        }, {
          $set: {
            cars: [],
          },
        }, done);
      });

      it('should allow to list cars', done => {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca/cars')
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

      it('should fail to get an unexisting car', done => {
        request(context.app).get(
          '/api/v0/users/abbacacaabbacacaabbacaca/cars/b17eb17eb17eb17eb17eb17e'
        )
        .auth('popol@moon.u', 'test')
        .expect(404)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          done();
        });
      });

      it('should allow to delete an unexisting car', done => {
        request(context.app).delete(
          '/api/v0/users/abbacacaabbacacaabbacaca/cars/b17eb17eb17eb17eb17eb17e'
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

    describe('when the user has cars', () => {

      it('should allow to list cars', done => {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca/cars')
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, [{
            _id: 'b17eb17eb17eb17eb17eb17e',
            contents: {
              xeeId: 1664,
              user_id: 'abbacacaabbacacaabbacaca',
              name: 'Opel Meriva',
              brand: 'Opel',
              type: 'xee',
            },
          }]);
          done();
        });
      });

      it('should allow to get a car', done => {
        request(context.app).get(
          '/api/v0/users/abbacacaabbacacaabbacaca/cars/b17eb17eb17eb17eb17eb17e'
        )
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, {
            _id: 'b17eb17eb17eb17eb17eb17e',
            contents: {
              xeeId: 1664,
              user_id: 'abbacacaabbacacaabbacaca',
              name: 'Opel Meriva',
              brand: 'Opel',
              type: 'xee',
            },
          });
          done();
        });
      });

      it('should allow to delete a car', done => {
        request(context.app).delete(
          '/api/v0/users/abbacacaabbacacaabbacaca/cars/b17eb17eb17eb17eb17eb17e'
        )
        .auth('popol@moon.u', 'test')
        .expect(410)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          context.db.collection('users').findOne({
            _id: castToObjectId('abbacacaabbacacaabbacaca'),
          }).then(user => {
            assert.equal(user.cars.length, 0);
            done(err);
          })
          .catch(done);
        });
      });

    });

  });

  describe('for root users', () => {

    it('should allow to get all cars', done => {
      request(context.app).get('/api/v0/cars')
      .auth('jpb@marvello.us', 'test')
      .expect(200)
      .end((err, res) => {
        if(err) {
          return done(err);
        }
        assert.deepEqual(res.body, [{
          _id: 'b17eb17eb17eb17eb17eb17e',
          contents: {
            xeeId: 1664,
            user_id: 'abbacacaabbacacaabbacaca',
            name: 'Opel Meriva',
            brand: 'Opel',
            type: 'xee',
          },
        }, {
          _id: 'b0b0b0b0b0b0b0b0b0b0b0b0',
          contents: {
            xeeId: 2432,
            user_id: 'babababababababababababa',
            name: 'Citroën Traction',
            brand: 'Citroën',
            type: 'xee',
          },
        }]);
        done();
      });
    });

  });

});
