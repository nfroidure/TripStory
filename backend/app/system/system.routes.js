'use strict';

var initSystemController = require('./system.controller');

module.exports = function initSystemsRoutes(context) {
  var systemController = initSystemController(context);

  context.app.get('/ping', systemController.ping);
  context.app.post('/bus', systemController.triggerEvent);
  context.app.use(systemController.catchErrors);
};
