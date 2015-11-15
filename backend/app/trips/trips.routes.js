'use strict';

var initTripController = require('./trips.controller');

module.exports = function initTripsRoutes(context) {
  var tripController = initTripController(context);

  context.app.get('/api/v0/trips', context.checkAuth, tripController.list);
  context.app.get('/api/v0/trips/:trip_id', context.checkAuth, tripController.get);
  context.app.put('/api/v0/trips/:trip_id', context.checkAuth, tripController.put);
  context.app.delete('/api/v0/trips/:trip_id', context.checkAuth, tripController.delete);
};
