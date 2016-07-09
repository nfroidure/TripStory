'use strict';

const request = require('request');
const workersUtils = require('../utils');
const controllersUtils = require('../../app/utils/controllers');
const locationUtils = require('../../app/utils/location.js');

const SERVER = 'https://cloud.xee.com/v1';
const xeeJobs = {
  A_XEE_SYNC: xeeSyncJob,
  A_XEE_SIGNUP: xeeSignupJob,
  A_XEE_LOGIN: xeeSignupJob,
};

module.exports = xeeJobs;

function xeeSignupJob(context, event) {
  return context.db.collection('users').findOne({
    _id: event.contents.user_id,
  })
  .then(user => new Promise((resolve, reject) => {
    context.logger.debug(
      `${SERVER}/user/${user.auth.xee.id}/car.json?access_token=${user.auth.xee.accessToken}`);
    request.get(
      `${SERVER}/user/${user.auth.xee.id}/car.json?access_token=${user.auth.xee.accessToken}`,
      function handleXEECars(err, res, data) {
        if(err) {
          return reject(err);
        }
        context.logger.debug(data);
        try {
          data = JSON.parse(data);
        } catch (err2) {
          return reject(err2);
        }
        context.logger.debug(data);
        resolve(data);
      }
    );
  }).then((cars) => {
    context.db.collection('users').updateOne({
      _id: user._id,
    }, {
      $set: {
        cars: cars.filter(car => !user.cars || user.cars.every(userCar => userCar.xeeId !== car.id)).map(car => ({
          _id: context.createObjectId(),
          type: 'xee',
          name: car.name,
          brand: car.brand,
          xeeId: car.id
        })),
      },
    });
  }));
}

function xeeSyncJob(context) {

  return workersUtils.getCurrentTrips(context, {
    carOnly: true,
  })
  .then(function handleXEETrips(tripsEvents) {
    return Promise.all(tripsEvents.map(tripEvent => context.db.collection('users').findOne({
      _id: tripEvent.owner_id,
      cars: { $elemMatch: {
        _id: tripEvent.trip.car_id,
      } },
    }).then(user => {
      const car = (user ? user.cars : []).filter(car => tripEvent.trip.car_id.toString() === car._id.toString() && 'xee' === car.type)[0];

      if(!car) {
        return Promise.resolve();
      }

      return new Promise(function xeePositionPromise(resolve, reject) {
        request.get(
          `${SERVER}/car/${car.xeeId}/carstatus.json?access_token=${user.auth.xee.accessToken}`,
          (err, res, data) => {
            context.logger.debug(JSON.stringify(data, null, 2));
            if(err) {
              return reject(err);
            }
            try {
              data = JSON.parse(data);
            } catch (err2) {
              return reject(err2);
            }
            resolve(data);
          }
        );
      }).then(data => {
        const geo = [
          data.location.latitude,
          data.location.longitude,
          data.location.altitude,
        ];

        return locationUtils.getFormatedAddress(
          data.location.latitude,
          data.location.longitude
        )
        .tap(address => {
          context.logger.debug(
            'Got #xee positions: %s http://maps.google.com/maps?q=%s,%s %s',
            geo.join(' '),
            data.location.latitude,
            data.location.longitude,
            address
          );
        })
        .catch(err => {
          context.logger.error('Geolocation error', err);
          return '';
        })
        .then(address => {
          let locationDate = new Date(`${data.location.date.replace(' ', 'T')}.000Z`);

          // Limit locations retrieval to the trip start date
          if(locationDate.getTime() < tripEvent.created.seal_date.getTime()) {
            locationDate = new Date(tripEvent.created.seal_date.getTime() + 1);
          }

          // Save the coordinates as an event
          return context.db.collection('events').findOneAndUpdate({
            'contents.type': 'xee-geo',
            'contents.trip_id': tripEvent._id,
            'created.seal_date': locationDate,
          }, {
            $set: {
              'contents.geo': geo,
              'contents.address': address,
            },
            $setOnInsert: {
              _id: context.createObjectId(),
              'contents.trip_id': tripEvent._id,
              'contents.type': 'xee-geo',
              trip: tripEvent.trip,
              owner_id: user._id,
              created: controllersUtils.getDateSeal(locationDate),
            },
          }, {
            upsert: true,
            returnOriginal: false,
          });
        })
        .then(result => {
          context.bus.trigger({
            exchange: 'A_TRIP_UPDATED',
            contents: {
              trip_id: tripEvent._id,
              event_id: result.value._id,
              users_ids: tripEvent.trip.friends_ids.concat([tripEvent.owner_id]),
            },
          });
        });
      });
    })));
  });
}
