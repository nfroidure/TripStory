'use strict';

const request = require('supertest');
const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const castToObjectId = require('mongodb').ObjectId;
const sinon = require('sinon');
const assert = require('assert');
const Promise = require('bluebird');
const initObjectIdStub = require('objectid-stub');

const initRoutes = require('../../app/routes');

describe('Users endpoints', () => {
  let context;

  before(done => {
    context = {
      env: { NODE_ENV: 'development' },
    };
    context.env.SESSION_SECRET = 'none';
    context.env.STATIC_PATH = path.join(__dirname, '..', '..', '..', 'mobile', 'www');
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

  describe('for simple users', () => {

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
          path: '/api/v0/users/:_id/?.*',
          methods: 127,
        }],
        friends_ids: [],
      }, done);
    });

    it('should allow to update its profile', done => {
      request(context.app).put('/api/v0/users/abbacacaabbacacaabbacaca')
        .auth('popol@moon.u', 'test')
        .send({
          contents: {
            email: 'popol@moon.u',
            name: 'Popol 1rst',
          },
        })
        .expect(201)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, {
            _id: 'abbacacaabbacacaabbacaca',
            contents: {
              name: 'Popol 1rst',
              email: 'popol@moon.u',
            },
          });
          done();
        });
    });

    it('should allow to delete its profile', done => {
      request(context.app).delete('/api/v0/users/abbacacaabbacacaabbacaca')
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

    describe('with friends', () => {

      beforeEach(done => {
        context.db.collection('users').insertOne({
          _id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
          contents: {
            name: 'Jean De La Fontaine',
            email: 'jdlf@academie.fr',
          },
          friends_ids: [castToObjectId('abbacacaabbacacaabbacaca')],
        }, done);
      });

      beforeEach(done => {
        context.db.collection('users').updateOne({
          _id: castToObjectId('abbacacaabbacacaabbacaca'),
        }, {
          $set: {
            friends_ids: [castToObjectId('b17eb17eb17eb17eb17eb17e')],
          },
        }, done);
      });

      it('should allow to list them', done => {
        request(context.app).get('/api/v0/users/abbacacaabbacacaabbacaca/friends')
          .auth('popol@moon.u', 'test')
          .expect(200)
          .end((err, res) => {
            if(err) {
              return done(err);
            }
            assert.deepEqual(res.body, [{
              _id: 'b17eb17eb17eb17eb17eb17e',
              contents: {
                name: 'Jean De La Fontaine',
                email: 'jdlf@academie.fr',
              },
            }]);
            done();
          });
      });

    });

    it('should allow to invite friends', done => {
      request(context.app).post('/api/v0/users/abbacacaabbacacaabbacaca/friends')
        .auth('popol@moon.u', 'test')
        .send({
          email: 'jdlf@academie.fr',
        })
        .expect(204)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(context.bus.trigger.args, [[{
            exchange: 'A_FRIEND_INVITE',
            contents: {
              user_id: castToObjectId('abbacacaabbacacaabbacaca'),
              friend_email: 'jdlf@academie.fr',
            },
          }]]);
          done();
        });
    });

    describe('for signuped friends', () => {

      beforeEach(done => {
        context.db.collection('users').insertOne({
          _id: castToObjectId('babababababababababababa'),
          contents: {
            name: 'Jean De La Fontaine',
            email: 'jdlf@academie.fr',
          },
          emailKeys: ['jdlf@academie.fr'],
          passwordHash: '$2a$10$s4FQh8WjiYQfx6gdO4AXAePe7tj4HXoo8fIcTsjD6YGkZ/B2oDDpW',
          rights: [{
            path: '/.*',
            methods: 127,
          }],
          friends_ids: [],
        }, done);
      });

      it('should allow to add friends', done => {
        request(context.app).post('/api/v0/users/abbacacaabbacacaabbacaca/friends')
          .auth('popol@moon.u', 'test')
          .send({
            email: 'jdlf@academie.fr',
          })
          .expect(204)
          .end((err, res) => {
            if(err) {
              return done(err);
            }
            assert.deepEqual(context.bus.trigger.args, [[{
              exchange: 'A_FRIEND_ADD',
              contents: {
                user_id: castToObjectId('abbacacaabbacacaabbacaca'),
                friend_id: castToObjectId('babababababababababababa'),
              },
            }]]);
            Promise.all([
              context.db.collection('users').findOne({
                _id: castToObjectId('abbacacaabbacacaabbacaca'),
              }),
              context.db.collection('users').findOne({
                _id: castToObjectId('babababababababababababa'),
              }),
            ])
            .spread((user, friend) => {
              assert.deepEqual(user.friends_ids, [
                castToObjectId('babababababababababababa'),
              ]);
              assert.deepEqual(friend.friends_ids, [
                castToObjectId('abbacacaabbacacaabbacaca'),
              ]);
            })
            .then(done)
            .catch(done);
          });
      });

    });

    it('should disallow to get others profile', done => {
      request(context.app).get('/api/v0/users/b17eb17eb17eb17eb17eb17e')
        .auth('popol@moon.u', 'test')
        .expect(403)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body.code, 'E_UNAUTHORIZED');
          done();
        });
    });

    it('should disallow to list other users', done => {
      request(context.app).get('/api/v0/users/b17eb17eb17eb17eb17eb17e')
        .auth('popol@moon.u', 'test')
        .expect(403)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body.code, 'E_UNAUTHORIZED');
          done();
        });
    });

  });

  describe('for root users', () => {

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

    it('should allow to get others profile', done => {
      request(context.app).get('/api/v0/users/b17eb17eb17eb17eb17eb17e')
        .auth('popol@moon.u', 'test')
        .expect(404)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body.code, 'E_NOT_FOUND');
          done();
        });
    });

    it('should list users', done => {
      request(context.app).get('/api/v0/users')
        .auth('popol@moon.u', 'test')
        .expect(200)
        .end((err, res) => {
          if(err) {
            return done(err);
          }
          assert.deepEqual(res.body, [{
            _id: 'abbacacaabbacacaabbacaca',
            contents: {
              name: 'Popol',
              email: 'popol@moon.u',
            },
          }]);
          done();
        });
    });

  });

});
