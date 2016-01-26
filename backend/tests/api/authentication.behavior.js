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
    context.checkAuth = function(req, res, next) {
      if(context.mockAuthenticated) {
        return next();
      }
      res.sendStatus(401);
    };
    context.tokens = {
      createToken: sinon.stub().returns({
        fake: 'token',
      }),
      checkToken: sinon.stub().returns(true),
    };
    context.time = sinon.stub().returns(1664);
    context.env = {
      SESSION_SECRET: 'none',
      FACEBOOK_ID: '123-456-789',
      FACEBOOK_SECRET: 'shhh-its-a-secret',
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

  beforeEach(function() {
    context.mockAuthenticated = false;
  });

  describe('for existing users', function() {

    beforeEach(function(done) {
      context.db.collection('users').insertOne({
        _id: castToObjectId('abbacacaabbacacaabbacaca'),
        contents: {
          name: 'Popol',
          email: 'popol@moon.u',
        },
        emailKeys: ['popol@moon.u'],
        passwordHash: '$2a$10$s4FQh8WjiYQfx6gdO4AXAePe7tj4HXoo8fIcTsjD6YGkZ/B2oDDpW',
      }, done);
    });

    it('should allow to log in', function(done) {
      request(context.app).post('/api/v0/login')
        .send({
          username: 'popol@moon.u',
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
          done(err);
        });
    });

    it('should allow to log out', function(done) {
      context.mockAuthenticated = true;
      request(context.app).post('/api/v0/logout')
        .expect(204)
        .end(function(err) {
          done(err);
        });
    });

    it.skip('should fail when signuping twice', function(done) {
      request(context.app).post('/api/v0/signup')
        .send({
          username: 'popol@moon.u',
          password: 'test',
        })
        .expect(500)
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
        username: 'popol@moon.u',
        password: 'test',
      })
      .expect(200)
      .end(function(err, res) {
        if(err) {
          return done(err);
        }
        assert.deepEqual(res.body, {
          _id: userId.toString(),
          contents: {
            email: 'popol@moon.u',
            name: 'popol@moon.u',
          },
        });
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

  describe('with facebook', function() {

    it('should redirect to the OAuth page', function(done) {
      request(context.app).get('/auth/facebook')
        .expect(302)
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          assert(context.tokens.createToken.callCount, 1);
          assert(0 === res.headers.location.indexOf(
            'https://www.facebook.com/v2.2/dialog/oauth' +
            '?response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A'
          ));
          // Here goes the server port that can vary
          assert(-1 !== res.headers.location.indexOf(
            '%2Fauth%2Fundefined%2Fauth%2Ffacebook%2Fcallback&scope=public_profile' +
            '%2Cemail%2Cuser_friends&state=eyJmYWtlIjoidG9rZW4ifQ%3D%3D' +
            '&client_id=123-456-789'
          ));
          done();
        });

    });

    it.skip('should sign up when user is not known', function() {
    });

    it.skip('should login up when user is known', function() {
    });

  });

});