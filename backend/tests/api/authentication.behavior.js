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

describe('Authentication endpoints', function() {
  var context;

  before(function(done) {
    context = {};
    context.tokens = {
      createToken: sinon.stub().returns({
        fake: 'token',
      }),
      checkToken: sinon.stub().returns(true),
    };
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

  describe.only('for existing users', function() {

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

    it('should allow to authenticate with basic auth', function(done) {
      request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca')
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end(function(err, res) {
          assert.deepEqual(res.body, {
            _id: 'abbacacaabbacacaabbacaca',
            contents: {
              name: 'Popol',
              email: 'popol@moon.u',
            },
          });
          done(err);
        });
    });

    it.only('should allow to log in', function(done) {
      request(context.app).post('/api/v0/login')
        .send({
          email: 'popol@moon.u',
          password: 'test',
        })
        .expect(200)
        .end(function(err, res) {
          assert.deepEqual(res.body, {
            _id: 'abbacacaabbacacaabbacaca',
            contents: {
              name: 'Popol',
              email: 'popol@moon.u',
            },
          });
          assert.deepEqual(context.bus.trigger.args, [[{
            exchange: 'A_LOCAL_LOGIN',
            contents: {
              user_id: castToObjectId('abbacacaabbacacaabbacaca'),
            },
          }]]);
          done(err);
        });
    });

    it('should fail when loggin in with bad password', function(done) {
      request(context.app).post('/api/v0/login')
        .send({
          email: 'popol@moon.u',
          password: 'testouille',
        })
        .expect(400)
        .end(function(err, res) {
          assert.equal(res.body.code, 'E_BAD_PASSWORD');
          done(err);
        });
    });

    it('should fail when loggin in with bad email', function(done) {
      request(context.app).post('/api/v0/login')
        .send({
          email: 'leon@moon.u',
          password: 'testouille',
        })
        .expect(400)
        .end(function(err, res) {
          assert.equal(res.body.code, 'E_BAD_EMAIL');
          done(err);
        });
    });

    it('should fail when loggin in with no username', function(done) {
      request(context.app).post('/api/v0/login')
        .send({
          password: 'testouille',
        })
        .expect(400)
        .end(function(err, res) {
          assert.equal(res.body.code, 'E_BAD_CREDENTIALS');
          done(err);
        });
    });

    it('should fail when loggin in with no password', function(done) {
      request(context.app).post('/api/v0/login')
        .send({
          username: 'popol@moon.u',
        })
        .expect(400)
        .end(function(err, res) {
          assert.equal(res.body.code, 'E_BAD_CREDENTIALS');
          done(err);
        });
    });

    it('should allow to log out when authenticated', function(done) {
      request(context.app).post('/api/v0/logout')
        .auth('popol@moon.u', 'test')
        .expect(204)
        .end(function(err) {
          assert.deepEqual(context.bus.trigger.args, [[{
            exchange: 'A_LOGOUT',
            contents: {
              user_id: castToObjectId('abbacacaabbacacaabbacaca'),
            },
          }]]);
          done(err);
        });
    });

    it('should fail when signuping twice', function(done) {
      request(context.app).post('/api/v0/signup')
        .send({
          email: 'popol@moon.u',
          name: 'Popol',
          password: 'test',
        })
        .expect(400)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          assert.equal(res.body.code, 'E_USER_EXISTS');
          done();
        });
    });

  });

  it('should allow to sign up', function(done) {
    var userId = context.createObjectId.next();

    request(context.app).post('/api/v0/signup')
      .send({
        email: 'popol@moon.u',
        name: 'Popol',
        password: 'test',
      })
      .expect(201)
      .end(function(err, res) {
        if(err) {
          return done(err);
        }
        assert.deepEqual(res.body, {
          _id: userId.toString(),
          contents: {
            email: 'popol@moon.u',
            name: 'Popol',
          },
        });
        assert.deepEqual(context.bus.trigger.args, [[{
          exchange: 'A_LOCAL_LOGIN',
          contents: {
            user_id: userId,
          },
        }]]);
        context.db.collection('users').findOne({
          _id: userId,
        }).then(function(user) {
          assert(user, 'User is created.');
          assert.equal(user.contents.email, 'popol@moon.u');
          assert(user.passwordHash, 'Computed the hash');
          assert.deepEqual(user.emailKeys, ['popol@moon.u']);
          done();
        }).catch(done);
      });
  });

});
