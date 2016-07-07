'use strict';

const MongoClient = require('mongodb').MongoClient;
const castToObjectId = require('mongodb').ObjectId;
const sinon = require('sinon');
const assert = require('assert');
const initObjectIdStub = require('objectid-stub');

const emailJobs = require('../../workers/email/email.jobs.js');

describe('Email jobs', function() {
  let context;

  before(function(done) {
    context = {};
    context.time = sinon.stub().returns(1664);
    context.env = {
      EMAIL: 'mailer-daemon@cloud',
      PORT: '3000',
    };
    context.base = 'http://localhost/';
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

  afterEach(function(done) {
    context.db.collection('users').deleteMany({}, done);
  });

  beforeEach(function(done) {
    context.sendMail = sinon.stub();
    done();
  });

  beforeEach(function(done) {
    context.db.collection('users').insertOne({
      _id: castToObjectId('abbacacaabbacacaabbacaca'),
      contents: {
        name: 'Popol',
        email: 'popol@moon.u',
      },
      emailKeys: ['popol@moon.u'],
      friends_ids: [],
    }, done);
  });

  describe('for friend additions', function() {
    const exchange = 'A_FRIEND_ADD';

    beforeEach(function(done) {
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
      }, done);
    });

    it('should send an email', function(done) {
      context.sendMail.returns(Promise.resolve());
      emailJobs[exchange](context, {
        exchange,
        contents: {
          user_id: castToObjectId('abbacacaabbacacaabbacaca'),
          friend_id: castToObjectId('babababababababababababa'),
        },
      })
      .then(function() {
        assert.equal(context.sendMail.callCount, 1);
        assert.deepEqual(
          context.sendMail.args[0][0],
          require('../fixtures/email-friend-add') // eslint-disable-line
        );
      })
      .then(done.bind(null, null))
      .catch(done);
    });

  });

  describe('for friend invites', function() {
    const exchange = 'A_FRIEND_INVITE';

    it('should send an email', function(done) {
      context.sendMail.returns(Promise.resolve());
      emailJobs[exchange](context, {
        exchange,
        contents: {
          user_id: castToObjectId('abbacacaabbacacaabbacaca'),
          friend_email: 'jdlf@academie.fr',
        },
      })
      .then(function() {
        assert.equal(context.sendMail.callCount, 1);
        assert.deepEqual(
          context.sendMail.args[0][0],
          require('../fixtures/email-friend-invite') // eslint-disable-line
        );
      })
      .then(done.bind(null, null))
      .catch(done);
    });

  });

  describe('for welcome email', function() {

    [
      'A_LOCAL_SIGNUP', 'A_FB_SIGNUP', 'A_GG_SIGNUP', 'A_TWITTER_SIGNUP',
      'A_XEE_SIGNUP',
    ].forEach(function(exchange) {
      it('should send an email (exchange ' + exchange + ')', function(done) {
        context.sendMail.returns(Promise.resolve());
        emailJobs[exchange](context, {
          exchange,
          contents: {
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
            friend_email: '',
          },
        })
        .then(function() {
          assert.equal(context.sendMail.callCount, 1);
          assert.deepEqual(
            context.sendMail.args[0][0],
            require('../fixtures/email-welcome') // eslint-disable-line
          );
        })
        .then(done.bind(null, null))
        .catch(done);
      });
    });

  });

});
