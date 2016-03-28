'use strict';

var initTripController = require('./trips.controller');

module.exports = function initTripsRoutes(context) {
  var tripController = initTripController(context);

  context.app.get(
    '/api/v0/trips',
    tripController.list
  );
  context.app.get(
    '/api/v0/users/:user_id/trips',
    tripController.list
  );
  context.app.get(
    '/api/v0/users/:user_id/trips/:trip_id',
    tripController.get
  );
  context.app.put(
    '/api/v0/users/:user_id/trips/:trip_id',
    tripController.put
  );
  context.app.delete(
    '/api/v0/users/:user_id/trips/:trip_id',
    tripController.delete
  );
};
