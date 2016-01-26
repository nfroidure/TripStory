'use strict';

var transformsUtils = require('../utils/transforms');

module.exports = initSystemController;

function initSystemController(context) {
  var systemController = {
    ping: systemControllerPing,
    triggerEvent: systemControllerTriggerEvent,
  };

  return systemController;

  function systemControllerPing(req, res) {
    res.status(200).send('pong');
  }

  function systemControllerTriggerEvent(req, res) {
    context.bus.trigger(transformsUtils.toCollection(req.body));
    res.status(201).json(req.body);
  }

}
