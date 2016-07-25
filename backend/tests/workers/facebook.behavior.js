'use strict';

const MongoClient = require('mongodb').MongoClient;
const castToObjectId = require('mongodb').ObjectId;
const sinon = require('sinon');
const assert = require('assert');
const Promise = require('bluebird');
const nock = require('nock');
const initObjectIdStub = require('objectid-stub');
const passport = require('passport');

const facebookJobs = require('../../workers/facebook/facebook.jobs.js');

describe('Facebook jobs', () => {
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
    MongoClient.connect('mongodb://localhost:27017/tripstory_test')
      .then(db => {
        context.db = db;
        done();
      })
      .catch(done);
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
        facebook: {
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
        facebook: {
          id: '10153532201272839',
          accessToken: 'COMMON_BOY',
          refreshToken: null,
        },
      },
    }], done);
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

  describe('for Facebook friends sync', () => {
    let friendsCall;

    beforeEach(() => {
      friendsCall = nock('https://graph.facebook.com:443', {
        encodedQueryParams: true,
      })
      .get('/v2.5/me/friends')
      .query({ access_token: 'COMMON_BOY' })
      .reply(200, {
        data: [{
          name: 'Jean De La Fontaine',
          id: '10153532201272839',
        }, {
          name: 'Victor Hugo',
          id: '10153874940679789',
        }],
        paging: {
          next: 'https://graph.facebook.com/v2.5/1664/friends',
        },
        summary: {
          total_count: 189,
        },
      }, {
        'access-control-allow-origin': '*',
        'content-type': 'text/javascript; charset=UTF-8',
        'x-fb-trace-id': 'FJgxiLd+P4g',
        'x-fb-rev': '2168097',
        pragma: 'no-cache',
        'cache-control': 'private, no-cache, no-store, must-revalidate',
        'facebook-api-version': 'v2.5',
        expires: 'Sat, 01 Jan 2000 00:00:00 GMT',
        vary: 'Accept-Encoding',
        date: 'Sat, 06 Feb 2016 10:01:53 GMT',
        connection: 'close',
      });
    });

    ['A_FB_SIGNUP', 'A_FB_LOGIN'].forEach(exchange => {
      it('should pair friends', done => {
        facebookJobs[exchange](context, {
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
        .catch(done);
      });
    });

  });

  describe('for Facebook statuses sync', () => {
    const exchange = 'A_FB_SYNC';

    afterEach(done => {
      context.db.collection('events').deleteMany({}, done);
    });

    describe('when there are no running trips', () => {

      it('should do nothing', done => {
        facebookJobs[exchange](context, {
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
      let facebookSatusesCall;
      let newEventsIds;

      beforeEach(() => {
        context.store.get.returns(Promise.resolve());
        context.store.set.returns(Promise.resolve());
        newEventsIds = [
          context.createObjectId.next(),
          context.createObjectId.next(1),
          context.createObjectId.next(2),
          context.createObjectId.next(3),
        ];

        facebookSatusesCall = nock('https://graph.facebook.com:443', {
          encodedQueryParams: true,
        })
        .get('/v2.5/me/posts')
        .query({
          access_token: 'COMMON_BOY',
          fields: 'description,caption,link,created_time,id,' +
          'application,from,icon,message,message_tags,name,picture,' +
          'place,status_type,type',
          since: Math.floor(context.time() / 1000),
        })
        .reply(200, {
          data: [{
            created_time: '2016-04-11T06:01:27+0000',
            id: '1664_125519447848804',
            from: {
              name: 'Popol',
              id: '1664',
            },
            message: 'Plop',
            place: {
              id: '144713192208788',
              name: 'Gare de Douai',
              location: {
                latitude: 50.371666666667,
                longitude: 3.0905555555556,
                street: 'Place de la gare',
                zip: '59500',
              },
            },
            status_type: 'mobile_status_update',
            type: 'status',
          }, {
            caption: 'tripstory.insertafter.com',
            link: 'https://tripstory.insertafter.com/',
            created_time: '2016-04-10T10:41:27+0000',
            id: '1664_124039517996797',
            from: {
              name: 'Popol',
              id: '1664',
            },
            icon: 'https://www.facebook.com/images/icons/post.gif',
            message: 'Visit ',
            name: 'tripstory.insertafter.com',
            status_type: 'shared_story',
            type: 'link',
          }, {
            link: 'https://www.facebook.com/photo.php?fbid=124030797997669&set=a.124030867997662.1073741826.100011722482255&type=3',
            created_time: '2016-04-10T10:33:42+0000',
            id: '1664_124030871330995',
            from: {
              name: 'Popol',
              id: '1664',
            },
            icon: 'https://www.facebook.com/images/icons/photo.gif',
            message: 'Pic!',
            picture: 'https://scontent.xx.fbcdn.net/hphotos-xpt1/v/t1.0-0/p130x130/12932741_124030797997669_9209190374435741367_n.jpg?oh=c8fa3ef139ee6e405390f5fe40e992f8&oe=57744799',
            status_type: 'added_photos',
            type: 'photo',
          }, {
            created_time: '2016-04-10T10:33:02+0000',
            id: '1664_124028311331251',
            from: {
              name: 'Popol',
              id: '1664',
            },
            message: 'Hello world!',
            status_type: 'mobile_status_update',
            type: 'status',
          }, {
            caption: 'Born on August 8, 1980',
            link: 'https://www.facebook.com/1664/posts/122704514796964',
            created_time: '1980-08-08T07:00:00+0000',
            id: '1664_122704514796964',
            from: {
              name: 'Popol',
              id: '1664',
            },
            icon: 'https://www.facebook.com/images/icons/post.gif',
            name: 'Born on August 8, 1980',
            type: 'link',
          }],
          paging: {
            previous: 'https://graph.facebook.com/v2.5/1664/posts?fields=description,caption,link,created_time,id,photos,application,from,icon,message,message_tags,name,picture,place,status_type,type&format=json&since=1460284887&access_token=CAAGxEMtZAMXoBAPkjiZBe8aLPXUIGZBEbEtdggcd2IEvmb7TL89XUrPQ3JLRkI8QLx0hIuuCYSpXTmnsbTXTOI8ZB0ZC3YsZBzfMIy8lEcftywFupYjoUjQLh8JBrBZAjE00JQ3NC9TmfmGzUFZBn5IFtM3n76wscsoVPK5Ee2FPYpuMQTYoT3snL3Wq7VxaTENNXtOLBj2X5QZDZD&limit=25&__paging_token=enc_AdDO14UdBfbcDlNZBVxE3XZCLCZCLPztcLpe3U4umjcZB0YiaRrQmzbJHngid9cJcO9ZCZBE2KjR3SfW5aXimwNfgVrZCwQph0itHJb8r89NIdqvyhnlwZDZD&__previous=1',
            next: 'https://graph.facebook.com/v2.5/1664/posts?fields=description,caption,link,created_time,id,photos,application,from,icon,message,message_tags,name,picture,place,status_type,type&format=json&access_token=CAAGxEMtZAMXoBAPkjiZBe8aLPXUIGZBEbEtdggcd2IEvmb7TL89XUrPQ3JLRkI8QLx0hIuuCYSpXTmnsbTXTOI8ZB0ZC3YsZBzfMIy8lEcftywFupYjoUjQLh8JBrBZAjE00JQ3NC9TmfmGzUFZBn5IFtM3n76wscsoVPK5Ee2FPYpuMQTYoT3snL3Wq7VxaTENNXtOLBj2X5QZDZD&limit=25&until=334566000&__paging_token=enc_AdACBXz3EuK5vKxtOLZAOsE81mwVzeU6ymWX9qZBac9XtRRjRy0cwf9wpqEnj09h09cAEvz7WDG079tYSV4uVHIu4ZBoTohqFC2GrX3FyLSHNxYSgZDZD',
          },
        }, {
          'access-control-allow-origin': '*',
          'content-type': 'text/javascript; charset=UTF-8',
          'x-fb-trace-id': 'FJgxiLd+P4g',
          'x-fb-rev': '2168097',
          pragma: 'no-cache',
          'cache-control': 'private, no-cache, no-store, must-revalidate',
          'facebook-api-version': 'v2.5',
          expires: 'Sat, 01 Jan 2000 00:00:00 GMT',
          vary: 'Accept-Encoding',
          date: 'Sat, 06 Feb 2016 10:01:53 GMT',
          connection: 'close',
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
            hash: 'lol',
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
        facebookJobs[exchange](context, {
          exchange,
          contents: {},
        })
        .then(() => {
          facebookSatusesCall.done();
          assert.deepEqual(context.bus.trigger.args, [[{
            exchange: 'A_TRIP_UPDATED',
            contents: {
              trip_id: castToObjectId('babababababababababababa'),
              event_id: newEventsIds[0],
              users_ids: [castToObjectId('abbacacaabbacacaabbacaca')],
            },
          }], [{
            exchange: 'A_TRIP_UPDATED',
            contents: {
              trip_id: castToObjectId('babababababababababababa'),
              event_id: newEventsIds[1],
              users_ids: [castToObjectId('abbacacaabbacacaabbacaca')],
            },
          }], [{
            exchange: 'A_TRIP_UPDATED',
            contents: {
              trip_id: castToObjectId('babababababababababababa'),
              event_id: newEventsIds[2],
              users_ids: [castToObjectId('abbacacaabbacacaabbacaca')],
            },
          }], [{
            exchange: 'A_TRIP_UPDATED',
            contents: {
              trip_id: castToObjectId('babababababababababababa'),
              event_id: newEventsIds[3],
              users_ids: [castToObjectId('abbacacaabbacacaabbacaca')],
            },
          }]]);
          return Promise.all([
            context.db.collection('events').findOne({
              _id: newEventsIds[0],
            }),
            context.db.collection('events').findOne({
              _id: newEventsIds[1],
            }),
            context.db.collection('events').findOne({
              _id: newEventsIds[2],
            }),
            context.db.collection('events').findOne({
              _id: newEventsIds[3],
            }),
          ]).spread((event1, event2, event3, event4) => {
            assert.deepEqual(event1, {
              _id: newEventsIds[0],
              contents: {
                facebookId: '1664_125519447848804',
                trip_id: castToObjectId('babababababababababababa'),
                type: 'facebook-status',
                geo: [],
                text: 'Plop',
                author_id: castToObjectId('abbacacaabbacacaabbacaca'),
              },
              trip: {
                friends_ids: [],
                title: 'Lol',
                description: 'Lol',
                hash: 'lol',
                car_id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
              },
              owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
              created: {
                seal_date: new Date('2016-04-11T06:01:27.000Z'),
              },
            });
            assert.deepEqual(event2, {
              _id: newEventsIds[1],
              contents: {
                facebookId: '1664_124039517996797',
                trip_id: castToObjectId('babababababababababababa'),
                type: 'facebook-link',
                geo: [],
                text: 'Visit ',
                author_id: castToObjectId('abbacacaabbacacaabbacaca'),
              },
              trip: {
                friends_ids: [],
                title: 'Lol',
                description: 'Lol',
                hash: 'lol',
                car_id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
              },
              owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
              created: {
                seal_date: new Date('2016-04-10T10:41:27.000Z'),
              },
            });
            assert.deepEqual(event3, {
              _id: newEventsIds[2],
              contents: {
                facebookId: '1664_124030871330995',
                trip_id: castToObjectId('babababababababababababa'),
                type: 'facebook-photo',
                geo: [],
                text: 'Pic!',
                author_id: castToObjectId('abbacacaabbacacaabbacaca'),
              },
              trip: {
                friends_ids: [],
                title: 'Lol',
                description: 'Lol',
                hash: 'lol',
                car_id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
              },
              owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
              created: {
                seal_date: new Date('2016-04-10T10:33:42.000Z'),
              },
            });
            assert.deepEqual(event4, {
              _id: newEventsIds[3],
              contents: {
                facebookId: '1664_124028311331251',
                trip_id: castToObjectId('babababababababababababa'),
                type: 'facebook-status',
                geo: [],
                text: 'Hello world!',
                author_id: castToObjectId('abbacacaabbacacaabbacaca'),
              },
              trip: {
                friends_ids: [],
                title: 'Lol',
                description: 'Lol',
                hash: 'lol',
                car_id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
              },
              owner_id: castToObjectId('abbacacaabbacacaabbacaca'),
              created: {
                seal_date: new Date('2016-04-10T10:33:02.000Z'),
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
