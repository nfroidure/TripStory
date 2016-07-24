'use strict';

const request = require('supertest');
const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const castToObjectId = require('mongodb').ObjectId;
const sinon = require('sinon');
const assert = require('assert');
const initObjectIdStub = require('objectid-stub');
const jwt = require('json-web-token');

const initRoutes = require('../../app/routes');

describe('JWT endpoints', () => {
  let context;

  before(done => {
    context = {
      env: { NODE_ENV: 'development' },
    };
    context.env.SESSION_SECRET = 'none';
    context.env.STATIC_PATH = path.join(__dirname, '..', '..', '..', 'mobile', 'www');
    context.env.JWT_SECRET = 'TOPSECRETTTTT';
    context.tokens = {
      createToken: sinon.stub().returns({
        fake: 'token',
      }),
      checkToken: sinon.stub().returns(true),
    };
    context.time = sinon.stub().returns(1664);
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

  describe('for existing users', () => {

    beforeEach(done => {
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

    it('should allow to create tokens', done => {
      request(context.app).post('/api/v0/tokens')
        .send({
          email: 'popol@moon.u',
          password: 'test',
        })
        .expect(200)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, {
            _id: 'abbacacaabbacacaabbacaca',
            token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' +
              'eyJpc3MiOiJUcmlwU3RvcnkiLCJhdWQiOiJXb3JsZCIsInN1YiI6ImFiYmFjYWN' +
              'hYWJiYWNhY2FhYmJhY2FjYSIsImlhdCI6ODY0MDJ9.' +
              'xmZDmkov-3f__qlZtHMlI8Ey8QxTuzmz2-Y2wLFxhps',
            payload: {
              aud: 'World',
              iat: 86402,
              iss: 'TripStory',
              sub: 'abbacacaabbacacaabbacaca',
            },
          });
          assert.deepEqual(context.bus.trigger.args, [[{
            exchange: 'A_JWT_TOKEN',
            contents: {
              ip: '::ffff:127.0.0.1',
              user_id: castToObjectId('abbacacaabbacacaabbacaca'),
            },
          }]]);
          done(err);
        });
    });

    describe('with correct jwt auth', () => {
      let token;

      beforeEach(done => {
        const payload = {
          iss: 'TripStory',
          aud: 'World',
          sub: 'abbacacaabbacacaabbacaca',
        };

        jwt.encode(context.env.JWT_SECRET, payload, (err, _token) => {
          if(err) {
            done(err);
            return;
          }
          token = _token;
          done();
        });
      });

      it('should allow to authenticate', done => {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca')
          .set('Authorization', 'Bearer ' + token)
          .expect(200)
          .end((err, res) => {
            if(err) {
              return done(err);
            }
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

    });

    describe('with bad jwt auth', () => {
      let token;

      beforeEach(done => {
        const payload = {
          iss: 'TripStory',
          aud: 'World',
          sub: 'abbacacaabbacacaabbacaca',
          iat: Math.round(((new Date().getTime()) + 2000) / 1000),
        };

        jwt.encode(context.env.JWT_SECRET, payload, (err, _token) => {
          if(err) {
            done(err);
            return;
          }
          token = _token.slice('5', '20');
          done();
        });
      });

      it('should not allow to authenticate', done => {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca')
          .set('Authorization', 'Bearer ' + token)
          .expect(401)
          .end((err, res) => {
            if(err) {
              return done(err);
            }
            done(err);
          });
      });

    });

  });

  describe('for unexisting users', () => {

    describe('with correct jwt auth', () => {
      let token;

      beforeEach(done => {
        const payload = {
          iss: 'TripStory',
          aud: 'World',
          sub: 'abbacacaabbacacaabbacaca',
        };

        jwt.encode(context.env.JWT_SECRET, payload, (err, _token) => {
          if(err) {
            done(err);
            return;
          }
          token = _token;
          done();
        });
      });

      it('should not allow to authenticate', done => {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca')
          .set('Authorization', 'Bearer ' + token)
          .expect(404)
          .end((err, res) => {
            if(err) {
              return done(err);
            }
            assert.deepEqual(res.body.code, 'E_UNEXISTING_USER');
            done(err);
          });
      });

    });

  });

});
