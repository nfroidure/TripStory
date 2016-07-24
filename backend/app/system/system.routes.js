'use strict';

const routesUtils = require('../utils/routes');
const systemMetadata = require('./system.metadata');
const initSystemController = require('./system.controller');

module.exports = function initSystemsRoutes(context) {
  const systemController = initSystemController(context);

  routesUtils.setupRoutesFromMetadata(context, systemController, systemMetadata);
  context.app.use(systemController.catchErrors);
};
