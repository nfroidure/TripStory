'use strict';

var workersUtils = {
  getCurrentTrips: workersUtilsGetCurrentTrips,
};

module.exports = workersUtils;

function workersUtilsGetCurrentTrips(context, options) {
  var match = {
    'contents.type': { $in: ['trip-start', 'trip-stop'] },
  };

  options = options || {};

  if(options.carOnly) {
    match['trip.car_id'] = { $exists: true };
  }

  return context.db.collection('events').aggregate([{
    $match: match,
  }, {
    $sort: { 'contents.date': -1 },
  }, {
    $group: {
      _id: '$contents.trip_id',
      trip: { $first: '$trip' },
      contents: { $first: '$contents' },
      owner_id: { $first: '$owner_id' },
    },
  }]).toArray()
  .then(function handleCurrentTrips(tripsEvents) {
    return tripsEvents.filter(function filterCurrentTrips(tripEvent) {
      return 'trip-start' === tripEvent.contents.type;
    });
    // context.logger.debug(JSON.stringify(tripsEvents, null, 2));
  });
}
