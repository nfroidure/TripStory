'use strict';

const workersUtils = {
  getCurrentTrips: workersUtilsGetCurrentTrips,
};

module.exports = workersUtils;

function workersUtilsGetCurrentTrips(context, options) {
  const match = {
    'contents.type': { $in: ['trip-start', 'trip-stop'] },
  };

  options = options || {};

  if(options.carOnly) {
    match['trip.car_id'] = { $exists: true };
  }

  return context.db.collection('events').aggregate([{
    $match: match,
  }, {
    $sort: { 'created.seal_date': -1 },
  }, {
    $group: {
      _id: '$contents.trip_id',
      trip: { $first: '$trip' },
      contents: { $first: '$contents' },
      owner_id: { $first: '$owner_id' },
      created: { $first: '$created' },
      modified: { $first: '$modified' },
    },
  }]).toArray()
  .then(function handleCurrentTrips(tripsEvents) {
    return tripsEvents.filter(function filterCurrentTrips(tripEvent) {
      return 'trip-start' === tripEvent.contents.type;
    });
  });
}
