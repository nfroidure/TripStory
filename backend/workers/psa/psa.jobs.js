'use strict';

const request = require('request');
const workersUtils = require('../utils');

const SERVER = 'https://api.mpsa.com/bgd/jdmc/1.0';
const psaJobs = {
  A_PSA_SYNC: psaSyncJob,
  A_PSA_SIGNUP: psaSignupJob,
};
const SECONDS = [6, 12, 18, 24, 30, 36, 42, 48, 54, 60];
let lastLatitude;
let lastLongitude;

module.exports = psaJobs;

// For each user retrieve current GPS location
// Check for nice places around if the vehicle is stopped
// Save the location event with some useful informations
function psaSyncJob(context) {
  // Get every current trips involving psa
  return workersUtils.getCurrentTrips(context, {
    carOnly: true,
  })
  .then(function handlePSATrips(tripsEvents) {
    return Promise.all(tripsEvents.map(tripEvent => context.db.collection('users').findOne({
      _id: tripEvent.owner_id,
      cars: { $elemMatch: {
        _id: tripEvent.trip.car_id,
      } },
    }).then(user => {
      const car = user.cars.filter(car => tripEvent.trip.car_id.toString() === car._id.toString() && 'psa' === car.type)[0];

      if(!car) {
        return Promise.resolve();
      }

      return new Promise(function psaPositionPromise(resolve, reject) {
        request.get(
          `${SERVER}/place/lastposition/${car.vin}?contract=${car.contract}&listsecond=${SECONDS.join(',')}&client_id=${context.env.PSA_CLIENT_ID}`,
          (err, res, data) => {
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
        let bestSecond;
        let geo;

        // context.logger.debug('Data', JSON.stringify(data, null, 2));
        // Get the best precision possible
        bestSecond = SECONDS.reduce((best, second) => {
          if(data.nbsat && (!best) || best.nbsat < data.nbsat[second]) {
            return {
              nbsat: data.nbsat[second],
              second,
            };
          }
          return best;
        }, { second: SECONDS[0], nbsat: 0 }).second;
        geo = [
          data.latitude[bestSecond],
          data.longitude[bestSecond],
          data.altitude[bestSecond],
        ];

        context.logger.debug('Got positions:', geo, bestSecond);

        if(data.latitude[bestSecond] !== lastLatitude ||
          data.longitude[bestSecond] !== lastLongitude
        ) {
          context.logger.debug(
            'Got positions: %s http://maps.google.com/maps?q=%s,%s',
            geo.join(' '),
            data.latitude[bestSecond],
            data.longitude[bestSecond]
          );

          request
            .get(
              `http://maps.googleapis.com/maps/api/geocode/json?latlng=${data.latitude[bestSecond]},${data.longitude[bestSecond]}`,
              (err, res, body) => {
                let address;

                if(err) {
                  context.logger.error(err);
                }
                body = JSON.parse(body);
                address = body.results[0].formatted_address;

                context.logger.debug(
                  'Je suis au : %s @hackthemobility',
                  address
                );

                // Save the coordinates as an event
                return context.db.collection('events').findOneAndUpdate({
                  'contents.type': 'psa-geo',
                  'contents.trip_id': tripEvent._id,
                  'contents.date': new Date(transformPSADate(data.lastUpdate)),
                }, {
                  $set: {
                    'contents.geo': geo,
                    'contents.address': address,
                  },
                  $setOnInsert: {
                    'contents.date': new Date(transformPSADate(data.lastUpdate)),
                    'contents.trip_id': tripEvent._id,
                    'contents.type': 'psa-geo',
                    trip: tripEvent.trip,
                  },
                }, {
                  upsert: true,
                  returnOriginal: false,
                });
              }
            )
          ;
        }

        lastLongitude = data.longitude[bestSecond];
        lastLatitude = data.latitude[bestSecond];

      });
    })));
  });
}

function psaSignupJob(context, event) {
  return context.db.collection('users').findOne({
    _id: event.contents.user_id,
  })
  .then(function handlePSASignup() {
    // Get the user car specs, save the color to customize the app
    // The event should be triggered at signup for one of the signup mechanisms
  });
}

function transformPSADate(psaDate) {
  return new Date(
    `${psaDate.substr(0, 4)}-${psaDate.substr(4, 2)}-${psaDate.substr(6, 2)}T${psaDate.substr(8, 2)}:${psaDate.substr(10, 2)}:${psaDate.substr(12, 2)}.000Z`
  );
}
