'use strict';

const MongoClient = require('mongodb').MongoClient;
const castToObjectId = require('mongodb').ObjectId;
const sinon = require('sinon');
const assert = require('assert');
const nock = require('nock');
const initObjectIdStub = require('objectid-stub');
const passport = require('passport');

const xeeJobs = require('../../workers/xee/xee.jobs.js');

describe('Xee jobs', () => {
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
      });
  });

  afterEach(done => {
    context.db.collection('users').deleteMany({}, done);
  });

  beforeEach(done => {
    context.bus = {
      trigger: sinon.spy(),
    };
    done();
  });

  beforeEach(done => {
    context.createObjectId.reset();
    done();
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
        xee: {
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
        xee: {
          id: '10153532201272839',
          accessToken: 'COMMON_BOY',
          refreshToken: null,
        },
      },
    }], done);
  });

  describe('for Xee cars sync', () => {
    let carsCall;
    let newCarId;

    beforeEach(() => {
      newCarId = context.createObjectId.next();
      carsCall = nock('https://cloud.xee.com:443', {
        encodedQueryParams: true,
      })
      .get('/v1/user/1664/car.json')
      .query({
        access_token: 'COMMON_BOY',
      })
      .reply(200, [{
        id: 2321,
        name: 'Opel Meriva',
        brand: 'Opel',
        model: 'Astra',
        year: 0,
        plateNumber: '',
        cardbId: 79,
      }], {
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'close',
        'cache-control': 'no-cache',
        date: 'Sat, 06 Feb 2016 12:09:14 GMT',
      });
    });

    ['A_XEE_SIGNUP', 'A_XEE_LOGIN'].forEach(exchange => {
      it('should retrieve cars', done => {
        xeeJobs[exchange](context, {
          exchange,
          contents: {
            user_id: castToObjectId('abbacacaabbacacaabbacaca'),
          },
        })
        .then(() => {
          carsCall.done();
          return context.db.collection('users').findOne({
            _id: castToObjectId('abbacacaabbacacaabbacaca'),
          }).then(user => {
            assert.deepEqual(user.cars, [{
              _id: newCarId,
              xeeId: 2321,
              name: 'Opel Meriva',
              brand: 'Opel',
              type: 'xee',
            }]);
          });
        })
        .then(done.bind(null, null))
        .catch(done);
      });
    });

  });

  describe('for Xee positions sync', () => {
    const exchange = 'A_XEE_SYNC';

    afterEach(done => {
      context.db.collection('events').deleteMany({}, done);
    });

    describe('when there are no trip', () => {

      it('should do nothing', done => {
        xeeJobs[exchange](context, {
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
      let positionCall;
      let addressCall;
      let newEventId;

      beforeEach(() => {
        newEventId = context.createObjectId.next();
        positionCall = nock('https://cloud.xee.com:443', {
          encodedQueryParams: true,
        })
        .get('/v1/car/1664/carstatus.json')
        .query({
          access_token: 'COMMON_BOY',
        })
        .reply(200, {
          accelerometer: {
            id: '0',
            x: -8,
            y: 0,
            z: 0,
            date: '2016-03-28 08:29:03',
            driverId: null,
          },
          location: {
            id: '0',
            date: '2016-03-28 08:44:53',
            longitude: 3.0614734,
            latitude: 50.243942,
            altitude: 41.5,
            nbSat: 8,
            driverId: null,
            heading: 172.32,
          },
          signals: [{
            id: '0',
            name: 'IgnitionSts',
            reportDate: '2016-03-28 08:43:53',
            value: '0',
            driverId: null,
          }, {
            id: '0',
            name: 'VehiculeSpeed',
            reportDate: '2016-03-28 08:43:33',
            value: '0',
            driverId: null,
          }],
        }, {
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
          connection: 'close',
          'cache-control': 'no-cache',
          date: 'Sat, 06 Feb 2016 12:09:14 GMT',
        });
        addressCall = nock('http://maps.googleapis.com:80', {
          encodedQueryParams: true,
        })
        .get('/maps/api/geocode/json')
        .query({ latlng: '50.243942,3.0614734' })
        .reply(200, {
          results: [{
            address_components: [{
              long_name: 207,
              short_name: 207,
              types: ['street_number'],
            }, {
              long_name: 'Rue Foch',
              short_name: 'Rue Foch',
              types: ['route'],
            }, {
              long_name: 'Rumaucourt',
              short_name: 'Rumaucourt',
              types: ['locality', 'political'],
            }, {
              long_name: 'Pas-de-Calais',
              short_name: 'Pas-de-Calais',
              types: ['administrative_area_level_2', 'political'],
            }, {
              long_name: 'France',
              short_name: 'FR',
              types: ['country', 'political'],
            }, {
              long_name: 62860,
              short_name: 62860,
              types: ['postal_code'],
            }],
            formatted_address: '207 Rue Foch, 62860 Rumaucourt, France',
            geometry: {
              location: {
                lat: 50.2439507,
                lng: 3.0612877,
              },
              location_type: 'ROOFTOP',
              viewport: {
                northeast: {
                  lat: 50.2452996802915,
                  lng: 3.062636680291502,
                },
                southwest: {
                  lat: 50.2426017197085,
                  lng: 3.059938719708499,
                },
              },
            },
            place_id: 'ChIJq-y1m6G2wkcRY2cVkIR2esM',
            types: ['street_address'],
          }],
          status: 'OK',
        }, {
          'content-type': 'application/json; charset=UTF-8',
          date: 'Mon, 28 Mar 2016 08:46:23 GMT',
          expires: 'Tue, 29 Mar 2016 08:46:23 GMT',
          'cache-control': 'public, max-age=86400',
          'access-control-allow-origin': '*',
          server: 'mafe',
          'x-xss-protection': '1; mode=block',
          'x-frame-options': 'SAMEORIGIN',
          'accept-ranges': 'none',
          vary: 'Accept-Language,Accept-Encoding',
          connection: 'close',
        });
      });

      beforeEach(done => {
        context.db.collection('users').updateOne({
          _id: castToObjectId('abbacacaabbacacaabbacaca'),
        }, {
          $set: {
            cars: [{
              _id: castToObjectId('b17eb17eb17eb17eb17eb17e'),
              xeeId: 1664,
              name: 'Opel Meriva',
              brand: 'Opel',
              type: 'xee',
            }],
          },
        }, done);
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

      it('should retrieve position', done => {
        xeeJobs[exchange](context, {
          exchange,
          contents: {},
        })
        .then(() => {
          positionCall.done();
          addressCall.done();
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
                trip_id: castToObjectId('babababababababababababa'),
                type: 'xee-geo',
                geo: [
                  50.243942,
                  3.0614734,
                  41.5,
                ],
                address: '207 Rue Foch, 62860 Rumaucourt, France',
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
                seal_date: new Date('2016-03-28T08:44:53.000Z'),
              },
            });
          });
        })
        .then(done.bind(null, null))
        .catch(done);
      });

      describe('for position retrieval with past date', () => {

        beforeEach(done => {
          context.db.collection('events').updateOne({
            _id: castToObjectId('babababababababababababa'),
          }, { $set: {
            'created.seal_date': new Date('2016-03-28T08:45:53.000Z'),
            'modified.0.seal_date': new Date('2016-03-28T08:45:53.000Z'),
          } }, done);
        });

        it('should retrieve position', done => {
          xeeJobs[exchange](context, {
            exchange,
            contents: {},
          })
          .then(() => {
            positionCall.done();
            addressCall.done();
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
                  trip_id: castToObjectId('babababababababababababa'),
                  type: 'xee-geo',
                  geo: [
                    50.243942,
                    3.0614734,
                    41.5,
                  ],
                  address: '207 Rue Foch, 62860 Rumaucourt, France',
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
                  seal_date: new Date('2016-03-28T08:45:53.001Z'),
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

});
