'use strict';

const transformsUtils = require('../utils/transforms');
const YHTTPError = require('yhttperror');

module.exports = initSystemController;

function initSystemController(context) {
  const systemController = {
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
    let payload;

    // Cast reaccess errors to YHTTPError ones
    if('E_UNAUTHORIZED' === err.message) {
      err = YHTTPError.wrap(err, req.user ? 403 : 401, 'E_UNAUTHORIZED', req._rights);
    }
    context.logger.error(err.code, err.stack, err.params);
    payload = {
      code: err.code || 'E_UNEXPECTED',
      params: err.params,
    };
    if('development' === context.env.NODE_ENV) {
      payload.stack = err.stack;
    }
    res.status(err.status || err.httpCode || 500).send(payload);
  }

}
