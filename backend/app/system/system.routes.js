'use strict';

const initSystemController = require('./system.controller');

module.exports = function initSystemsRoutes(context) {
  const systemController = initSystemController(context);

  context.app.get('/ping', systemController.ping);
  context.app.post('/bus', systemController.triggerEvent);
  context.app.use(systemController.catchErrors);
};
