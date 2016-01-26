'use strict';

var request = require('supertest');
var express = require('express');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var sinon = require('sinon');
var assert = require('assert');

var initRoutes = require('../../app/routes');

describe('System endpoints', function() {
  var context;

  before(function(done) {
    context = {};
    context.checkAuth = function() {};
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

  it('should allow to ping the server', function(done) {
    request(context.app).get('/ping')
      .expect(200)
      .expect('pong')
      .end(function(err) {
        done(err);
      });
  });

  it('should allow to publish to the bus', function(done) {
    var payload = {
      plop: 'kikoolol',
    };

    request(context.app).post('/bus')
      .send(payload)
      .expect(201)
      .end(function(err, res) {
        assert.deepEqual(res.body, payload);
        assert.equal(context.bus.trigger.callCount, 1);
        assert.deepEqual(context.bus.trigger.args[0], [payload]);
        done(err);
      });
  });
});
