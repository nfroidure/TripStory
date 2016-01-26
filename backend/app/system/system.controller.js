'use strict';

var transformsUtils = require('../utils/transforms');

module.exports = initSystemController;

function initSystemController(context) {
  var systemController = {
    ping: systemControllerPing,
    triggerEvent: systemControllerTriggerEvent,
    catchErrors: systemControllerCatchErrors,
  };

  return systemController;

  function systemControllerPing(req, res) {
    res.status(200).send('pong');
  }

  function systemControllerTriggerEvent(req, res) {
    context.bus.trigger(transformsUtils.toCollection(req.body));
    res.status(201).json(req.body);
  }

  function systemControllerCatchErrors(err, req, res, next) { // eslint-disable-line
    context.logger.error(err.stack);
    res.status(err.status || 500).send({
      code: err.code || 'E_UNEXPECTED',
      stack: err.stack,
    });
  }

}
