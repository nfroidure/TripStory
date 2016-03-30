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

describe('Cars endpoints', function() {
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
      cars: [{
        _id: castToObjectId('b0b0b0b0b0b0b0b0b0b0b0b0'),
        xeeId: 2432,
        name: 'Citroën Traction',
        brand: 'Citroën',
        type: 'xee',
      }],
    }], done);
  });

  describe('for simple users', function() {

    describe('when the user has no cars', function() {

      beforeEach(function(done) {
        context.db.collection('users').updateOne({
          _id: castToObjectId('abbacacaabbacacaabbacaca'),
        }, {
          $set: {
            cars: [],
          },
        }, done);
      });

      it('should allow to list cars', function(done) {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca/cars')
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, []);
          done();
        });
      });

      it('should fail to get an unexisting car', function(done) {
        request(context.app).get(
          '/api/v0/users/abbacacaabbacacaabbacaca/cars/b17eb17eb17eb17eb17eb17e'
        )
        .auth('popol@moon.u', 'test')
        .expect(404)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          done();
        });
      });

      it('should allow to delete an unexisting car', function(done) {
        request(context.app).delete(
          '/api/v0/users/abbacacaabbacacaabbacaca/cars/b17eb17eb17eb17eb17eb17e'
        )
        .auth('popol@moon.u', 'test')
        .expect(410)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, {});
          done();
        });
      });

    });

    describe('when the user has cars', function() {

      it('should allow to list cars', function(done) {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca/cars')
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end(function(err, res) {
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

      it('should allow to get a car', function(done) {
        request(context.app).get(
          '/api/v0/users/abbacacaabbacacaabbacaca/cars/b17eb17eb17eb17eb17eb17e'
        )
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end(function(err, res) {
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

      it('should allow to delete a car', function(done) {
        request(context.app).delete(
          '/api/v0/users/abbacacaabbacacaabbacaca/cars/b17eb17eb17eb17eb17eb17e'
        )
        .auth('popol@moon.u', 'test')
        .expect(410)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          context.db.collection('users').findOne({
            _id: castToObjectId('abbacacaabbacacaabbacaca'),
          }).then(function(user) {
            assert.equal(user.cars.length, 0);
            done(err);
          })
          .catch(done);
        });
      });

    });

  });

  describe('for root users', function() {

    it('should allow to get all cars', function(done) {
      request(context.app).get('/api/v0/cars')
      .auth('jpb@marvello.us', 'test')
      .expect(200)
      .end(function(err, res) {
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
