'use strict';

const request = require('supertest');
const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const castToObjectId = require('mongodb').ObjectId;
const sinon = require('sinon');
const assert = require('assert');

const initRoutes = require('../../app/routes');

describe('System endpoints', function() {
  let context;

  before(function(done) {
    context = {};
    context.env = {
      SESSION_SECRET: 'none',
      mobile_path: path.join(__dirname, '..', '..', '..', 'mobile', 'www'),
    };
    context.logger = {
      error: sinon.spy(),
      debug: sinon.spy(),
      info: sinon.spy(),
    };
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

  it('should allow to ping the server', function(done) {
    request(context.app).get('/ping')
      .expect(200)
      .expect('pong')
      .end(function(err) {
        if(err) {
          return done(err);
        }
        done();
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

    it('should allow to publish to the bus', function(done) {
      const payload = {
        plop: 'kikoolol',
      };

      request(context.app).post('/bus')
        .send(payload)
        .auth('popol@moon.u', 'test')
        .expect(201)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, payload);
          assert.equal(context.bus.trigger.callCount, 1);
          assert.deepEqual(context.bus.trigger.args[0], [payload]);
          done();
        });
    });
  });
});
