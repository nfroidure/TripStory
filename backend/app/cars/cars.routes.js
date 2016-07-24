'use strict';

const routesUtils = require('../utils/routes');
const carMetadata = require('./cars.metadata');
const initCarController = require('./cars.controller');

module.exports = function initCarsRoutes(context) {
  const carController = initCarController(context);

  routesUtils.setupRoutesFromMetadata(context, carController, carMetadata);
};
