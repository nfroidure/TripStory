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

describe('Users endpoints', function() {
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

  describe('for simple users', function() {

    beforeEach(function(done) {
      context.db.collection('users').insertOne({
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
      }, done);
    });

    it('should allow to update its profile', function(done) {
      request(context.app).put('/api/v0/users/abbacacaabbacacaabbacaca')
        .auth('popol@moon.u', 'test')
        .send({
          contents: {
            email: 'popol@moon.u',
            name: 'Popol 1rst',
          },
        })
        .expect(201)
        .end(function(err, res) {
          assert.deepEqual(res.body, {
            _id: 'abbacacaabbacacaabbacaca',
            contents: {
              name: 'Popol 1rst',
              email: 'popol@moon.u',
            },
          });
          done(err);
        });
    });

    it('should allow to delete its profile', function(done) {
      request(context.app).delete('/api/v0/users/abbacacaabbacacaabbacaca')
        .auth('popol@moon.u', 'test')
        .expect(410)
        .end(function(err, res) {
          assert.deepEqual(res.body, {});
          done(err);
        });
    });

      describe('with friends', function() {

        beforeEach(function(done) {
          context.db.collection('users').insertOne({
            _id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
            contents: {
              name: 'Jean De La Fontaine',
              email: 'jdlf@academie.fr',
            },
            friends_ids: [castToObjectId('abbacacaabbacacaabbacaca')],
          }, done);
        });

          beforeEach(function(done) {
            context.db.collection('users').updateOne({
              _id: castToObjectId('abbacacaabbacacaabbacaca'),
            }, {
              $set: {
                friends_ids: [castToObjectId('b17eb17eb17eb17eb17eb17e')],
              },
            }, done);
          });

        it('should allow to list them', function(done) {
          request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca/friends')
            .auth('popol@moon.u', 'test')
            .expect(200)
            .end(function(err, res) {
              assert.deepEqual(res.body, [{
                _id: 'b17eb17eb17eb17eb17eb17e',
                contents: {
                  name: 'Jean De La Fontaine',
                  email: 'jdlf@academie.fr',
                },
              }]);
              done(err);
            });
        });

      });

    it('should disallow to get others profile', function(done) {
      request(context.app).get('/api/v0/users/b17eb17eb17eb17eb17eb17e')
        .auth('popol@moon.u', 'test')
        .expect(403)
        .end(function(err, res) {
          assert.deepEqual(res.body.code, 'E_UNAUTHORIZED');
          done(err);
        });
    });

    it('should disallow to list other users', function(done) {
      request(context.app).get('/api/v0/users/b17eb17eb17eb17eb17eb17e')
        .auth('popol@moon.u', 'test')
        .expect(403)
        .end(function(err, res) {
          assert.deepEqual(res.body.code, 'E_UNAUTHORIZED');
          done(err);
        });
    });

  });

  describe('for root users', function() {

    beforeEach(function(done) {
      context.db.collection('users').insertOne({
        _id: castToObjectId('abbacacaabbacacaabbacaca'),
        contents: {
          name: 'Popol',
          email: 'popol@moon.u',
        },
        emailKeys: ['popol@moon.u'],
        passwordHash: '$2a$10$s4FQh8WjiYQfx6gdO4AXAePe7tj4HXoo8fIcTsjD6YGkZ/B2oDDpW',
        rights: [{
          path: '/.*',
          methods: 127,
        }],
      }, done);
    });

    it('should allow to get others profile', function(done) {
      request(context.app).get('/api/v0/users/b17eb17eb17eb17eb17eb17e')
        .auth('popol@moon.u', 'test')
        .expect(404)
        .end(function(err, res) {
          assert.deepEqual(res.body.code, 'E_NOT_FOUND');
          done(err);
        });
    });

    it('should list users', function(done) {
      request(context.app).get('/api/v0/users')
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end(function(err, res) {
          assert.deepEqual(res.body, [{
            _id: 'abbacacaabbacacaabbacaca',
            contents: {
              name: 'Popol',
              email: 'popol@moon.u',
            },
          }]);
          done(err);
        });
    });

  });

});
