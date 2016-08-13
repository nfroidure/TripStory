'use strict';

const routesUtils = require('../utils/routes');
const tripMetadata = require('./trips.metadata');
const initTripsController = require('./trips.controller');

module.exports = function initTripsRoutes(context) {
  const tripController = initTripsController(context);

  routesUtils.setupRoutesFromMetadata(context, tripController, tripMetadata);
};
