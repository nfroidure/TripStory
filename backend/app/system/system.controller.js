'use strict';

var transformsUtils = require('../utils/transforms');
var YHTTPError = require('yhttperror');

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
    // Cast reaccess errors to YHTTPError ones
    if('E_UNAUTHORIZED' === err.message) {
      err = YHTTPError.wrap(err, req.user ? 403 : 401, 'E_UNAUTHORIZED', req._rights);
    }

    context.logger.error(err.code, err.stack, err.params);
    res.status(err.status || err.httpCode || 500).send({
      code: err.code || 'E_UNEXPECTED',
      stack: err.stack,
    });
  }

}
