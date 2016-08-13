'use strict';

const routesUtils = require('../utils/routes');
const eventMetadata = require('./events.metadata');
const initEventController = require('./events.controller');

module.exports = function initEventsRoutes(context) {
  const eventController = initEventController(context);

  routesUtils.setupRoutesFromMetadata(context, eventController, eventMetadata);
};
