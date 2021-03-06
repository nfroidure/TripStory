'use strict';

const MongoClient = require('mongodb').MongoClient;
const castToObjectId = require('mongodb').ObjectId;
const sinon = require('sinon');
const assert = require('assert');
const Promise = require('bluebird');
const nock = require('nock');
const Twitter = require('twitter');
const initObjectIdStub = require('objectid-stub');
const passport = require('passport');
const fs = require('fs');
const path = require('path');

const twitterJobs = require('../../workers/twitter/twitter.jobs.js');

describe('Twitter jobs', () => {
  let context;

  before(done => {
    context = {
      env: { NODE_ENV: 'development' },
    };
    context.time = sinon.stub().returns(1664);
    context.passport = passport;
    context.base = 'http://localhost/';
    context.logger = {
      error: sinon.spy(),
      debug: sinon.spy(),
      info: sinon.spy(),
    };
    context.createObjectId = initObjectIdStub({
      ctor: castToObjectId,
    });
    context.twitter = new Twitter({
      consumer_key: 'process.env.TWITTER_ID',
      consumer_secret: 'process.env.TWITTER_SECRET',
      access_token_key: 'process.env.TWITTER_ACCESS_TOKEN',
      access_token_secret: 'process.env.TWITTER_ACCESS_TOKEN_SECRET',
    });
    MongoClient.connect('mongodb://localhost:27017/tripstory_test')
      .then(db => {
        context.db = db;
        done();
      });
  });

  beforeEach(done => {
    context.bus = {
      trigger: sinon.spy(),
    };
    context.store = {
      get: sinon.stub(),
      set: sinon.stub(),
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
      friends_ids: [],
      auth: {
        twitter: {
          id: '1664',
          accessToken: 'COMMON_BOY',
          refreshToken: null,
        },
      },
    }, {
      _id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
      contents: {
        name: 'Jean De La Fontaine',
        email: 'jdlf@academie.fr',
      },
      emailKeys: ['popol@moon.u'],
      friends_ids: [],
      auth: {
        twitter: {
          id: '2432',
          accessToken: 'COMMON_BOY',
          refreshToken: null,
        },
      },
    }], done);
  });

  describe('for Twitter friends sync', () => {
    let friendsCall;

    beforeEach(() => {
      friendsCall =
      nock('https://api.twitter.com:443', {
        encodedQueryParams: true,
      })
      .get('/1.1/friends/ids.json')
      .reply(200, {
        ids: [1024, 2432, 416],
        next_cursor: 0,
        next_cursor_str: '0',
        previous_cursor: 0,
        previous_cursor_str: '0',
      }, {
        'content-disposition': 'attachment; filename=json.json',
        'content-length': '3773',
        'content-type': 'application/json;charset=utf-8',
        date: 'Mon, 28 Mar 2016 20:34:26 GMT',
        expires: 'Tue, 31 Mar 1981 05:00:00 GMT',
        'last-modified': 'Mon, 28 Mar 2016 20:34:26 GMT',
        pragma: 'no-cache',
        status: '200 OK',
        'strict-transport-security': 'max-age=631138519',
        'x-access-level': 'read',
        'x-connection-hash': '26061a6785a1b73424040ead52e98fc8',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'x-rate-limit-limit': '15',
        'x-rate-limit-remaining': '14',
        'x-rate-limit-reset': '1459198166',
        'x-response-time': '124',
        'x-transaction': '7f121cfbac00e2d9',
        'x-twitter-response-tags': 'BouncerCompliant',
        'x-xss-protection': '1; mode=block',
      });

    });

    ['A_TWITTER_SIGNUP', 'A_TWITTER_LOGIN'].forEach(exchange => {
      it('should pair friends', done => {
        twitterJobs[exchange](context, {
          exchange,
          contents: {
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
          },
        })
        .then(() => {
          friendsCall.done();
          return Promise.all([
            context.db.collection('users').findOne({
              _id: castToObjectId('abbacacaabbacacaabbacaca'),
            }),
            context.db.collection('users').findOne({
              _id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
            }),
          ]).spread((user, friend) => {
            assert.deepEqual(user.friends_ids, [
              castToObjectId('b17eb17eb17eb17eb17eb17e'),
            ]);
            assert.deepEqual(friend.friends_ids, [
              castToObjectId('abbacacaabbacacaabbacaca'),
            ]);
          });
        })
        .then(done.bind(null, null))
        .catch(console.log.bind(console))
        .catch(done);
      });
    });

  });

  describe('for Twitter statuses sync', () => {
    const exchange = 'A_TWITTER_SYNC';

    afterEach(done => {
      context.db.collection('events').deleteMany({}, done);
    });

    describe('when there are no trip', () => {

      it('should do nothing', done => {
        twitterJobs[exchange](context, {
          exchange,
          contents: {},
        })
        .then(() => {
          assert.deepEqual(context.bus.trigger.args, []);
          return context.db.collection('events').count({})
          .then(count => {
            assert.equal(count, 0);
          });
        })
        .then(done.bind(null, null))
        .catch(done);

      });

    });

    describe('when there are running trips', () => {
      let twitterStatusesCall;
      let newEventId;

      beforeEach(() => {
        context.store.get.returns(Promise.resolve());
        context.store.set.returns(Promise.resolve());
        newEventId = context.createObjectId.next();
        twitterStatusesCall = nock('https://api.twitter.com:443', {
          encodedQueryParams: true,
        })
        .get('/1.1/statuses/user_timeline.json')
        .query({ user_id: '1664', include_rts: 'false' })
        .reply(200, [{
          created_at: 'Mon Mar 28 20:30:34 +0000 2016',
          id: 714550269917446100, id_str: '714550269917446146',
          text: 'Trop #lol 😂 https://t.co/i1tiWZ3lIk',
          entities: {
            hashtags: [{
              text: 'JasonStantham', indices: [7, 21],
            }, {
              text: 'lol', indices: [47, 51],
            }],
            symbols: [],
            user_mentions: [],
            urls: [],
            media: [],
          },
          truncated: false,
          metadata: {
            iso_language_code: 'fr',
            result_type: 'recent',
          },
          source: '<a href="http://twitter.com/#!/download/ipad" rel="nofollow">Twitter for iPad</a>',
          in_reply_to_status_id: null,
          in_reply_to_status_id_str: null,
          in_reply_to_user_id: null,
          in_reply_to_user_id_str: null,
          in_reply_to_screen_name: null,
          user: {
            id: 1664, id_str: '704076333953974274',
            name: 'Benoît Marques', screen_name: 'benoit_marques',
            location: 'France',
            description: '',
            url: null,
            entities: {
              description: { urls: [] },
            },
            protected: false,
            followers_count: 45,
            friends_count: 134,
            listed_count: 2,
            created_at: 'Sun Feb 28 22:50:53 +0000 2016',
            favourites_count: 678,
            utc_offset: null,
            time_zone: null,
            geo_enabled: false,
            verified: false,
            statuses_count: 237,
            lang: 'fr',
            contributors_enabled: false,
            is_translator: false,
            is_translation_enabled: false,
            profile_background_color: 'F5F8FA',
            profile_background_image_url: null,
            profile_background_image_url_https: null,
            profile_background_tile: false,
            profile_image_url: 'http://pbs.twimg.com/profile_images/704080725394460677/K3piFMk8_normal.jpg',
            profile_image_url_https: 'https://pbs.twimg.com/profile_images/704080725394460677/K3piFMk8_normal.jpg',
            profile_banner_url: 'https://pbs.twimg.com/profile_banners/704076333953974274/1456700926',
            profile_link_color: '2B7BB9',
            profile_sidebar_border_color: 'C0DEED',
            profile_sidebar_fill_color: 'DDEEF6',
            profile_text_color: '333333',
            profile_use_background_image: true,
            has_extended_profile: true,
            default_profile: true,
            default_profile_image: false,
            following: false,
            follow_request_sent: false,
            notifications: false,
          },
          geo: null,
          coordinates: null,
          place: null,
          contributors: null,
          is_quote_status: false,
          retweet_count: 0,
          favorite_count: 0,
          favorited: false,
          retweeted: false,
          possibly_sensitive: false,
          lang: 'fr',
        }], {
          'cache-control': 'no-cache, no-store, must-revalidate, pre-check=0, post-check=0',
          connection: 'close',
          'content-disposition': 'attachment; filename=json.json',
          'content-length': '78695',
          'content-type': 'application/json;charset=utf-8',
          date: 'Mon, 28 Mar 2016 20:32:15 GMT',
          expires: 'Tue, 31 Mar 1981 05:00:00 GMT',
          'last-modified': 'Mon, 28 Mar 2016 20:32:15 GMT',
          pragma: 'no-cache',
          server: 'tsa_o',
          status: '200 OK',
          'strict-transport-security': 'max-age=631138519',
          'x-access-level': 'read',
          'x-content-type-options': 'nosniff',
          'x-frame-options': 'SAMEORIGIN',
          'x-rate-limit-limit': '180',
          'x-rate-limit-remaining': '177',
          'x-rate-limit-reset': '1459198035',
        });
      });

      beforeEach(done => {
        context.db.collection('events').insertOne({
          _id: castToObjectId('babababababababababababa'),
          contents: {
            trip_id: castToObjectId('babababababababababababa'),
            type: 'trip-start',
          },
          owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
          trip: {
            friends_ids: [],
            title: 'Lol',
            description: 'Lol',
            car_id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
          },
          created: {
            seal_date: new Date(context.time()),
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
            ip: '::1',
          },
          modified: [{
            seal_date: new Date(context.time()),
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
            ip: '::1',
          }],
        }, done);
      });

      it('should retrieve tweets', done => {
        twitterJobs[exchange](context, {
          exchange,
          contents: {},
        })
        .then(() => {
          twitterStatusesCall.done();
          assert.deepEqual(context.bus.trigger.args, [[{
            exchange: 'A_TRIP_UPDATED',
            contents: {
              trip_id: castToObjectId('babababababababababababa'),
              event_id: newEventId,
              users_ids: [castToObjectId('abbacacaabbacacaabbacaca')],
            },
          }]]);
          return context.db.collection('events').findOne({
            _id: newEventId,
          }).then(event => {
            assert.deepEqual(event, {
              _id: newEventId,
              contents: {
                twitterId: 714550269917446100,
                trip_id: castToObjectId('babababababababababababa'),
                type: 'twitter-status',
                geo: [],
                text: 'Trop #lol 😂 https://t.co/i1tiWZ3lIk',
                author_id: castToObjectId('abbacacaabbacacaabbacaca'),
              },
              trip: {
                friends_ids: [],
                title: 'Lol',
                description: 'Lol',
                car_id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
              },
              owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
              created: {
                seal_date: new Date('2016-03-28T20:30:34.000Z'),
              },
            });
          });
        })
        .then(done.bind(null, null))
        .catch(done);
      });

    });

    describe('when there are running trips and media tweets', function() {
      var twitterStatusesCall;
      var newEventId;

      beforeEach(function() {
        var statuses = JSON.parse(fs.readFileSync(
          path.join(__dirname, '..', 'fixtures', 'twitter-media.json'),
          'utf-8'
        ));

        context.store.get.returns(Promise.resolve());
        context.store.set.returns(Promise.resolve());
        newEventId = context.createObjectId.next();
        twitterStatusesCall = nock('https://api.twitter.com:443', {
          encodedQueryParams: true,
        })
        .get('/1.1/statuses/user_timeline.json')
        .query({ user_id: '1664', include_rts: 'false' })
        .reply(200, statuses, {
          'content-type': 'application/json;charset=utf-8',
          status: '200 OK',
        });
      });

      beforeEach(function(done) {
        context.db.collection('events').insertOne({
          _id: castToObjectId('babababababababababababa'),
          contents: {
            trip_id: castToObjectId('babababababababababababa'),
            type: 'trip-start',
          },
          owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
          trip: {
            friends_ids: [],
            title: 'Lol',
            description: 'Lol',
            car_id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
          },
          created: {
            seal_date: new Date(context.time()),
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
            ip: '::1',
          },
          modified: [{
            seal_date: new Date(context.time()),
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
            ip: '::1',
          }],
        }, done);
      });

      it('should retrieve tweets', function(done) {
        twitterJobs[exchange](context, {
          exchange: exchange,
          contents: {},
        })
        .then(function() {
          twitterStatusesCall.done();
          assert.deepEqual(context.bus.trigger.args, [[{
            exchange: 'A_TRIP_UPDATED',
            contents: {
              trip_id: castToObjectId('babababababababababababa'),
              event_id: newEventId,
              users_ids: [castToObjectId('abbacacaabbacacaabbacaca')],
            },
          }]]);
          return context.db.collection('events').findOne({
            _id: newEventId,
          }).then(function(event) {
            assert.deepEqual(event, {
              _id: newEventId,
              contents: {
                twitterId: 731895976785522700,
                trip_id: castToObjectId('babababababababababababa'),
                type: 'twitter-status',
                geo: [],
                text:
                  '@xavhan @_flexbox Trip Story commence à fonctionner :).' +
                  ' Une bonne âme pour cette issue? https://t.co/aFHFPFyy8Z :/' +
                  ' https://t.co/hAfg7FPqc6',
                media: [{
                  type: 'image',
                  src_url: 'https://pbs.twimg.com/media/Cig3giKW0AAddsD.jpg',
                  link_url: 'http://twitter.com/nfroidure/status/731895976785522688/photo/1',
                }],
                author_id: castToObjectId('abbacacaabbacacaabbacaca'),
              },
              trip: {
                friends_ids: [],
                title: 'Lol',
                description: 'Lol',
                car_id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
              },
              owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
              created: {
                seal_date: new Date('2016-05-15T17:16:13.000Z'),
              },
            });
          });
        })
        .then(done.bind(null, null))
        .catch(done);
      });

    });

  });

});
