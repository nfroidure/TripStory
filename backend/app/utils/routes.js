'use strict';

const YHTTPError = require('yhttperror');

const routesUtils = {
  setupRoutesFromMetadata,
};

function setupRoutesFromMetadata(context, controller, metadata) {
  Object.keys(metadata).forEach((path) => {
    Object.keys(metadata[path]).forEach((method) => {
      const data = metadata[path][method];
      const args = [
        path,
      ];

      if('development' === context.env.NODE_ENV) {
        args.push(_checkResponse.bind(null, data));
      }

      args.push(controller[data.controller]);

      context.app[method.toLowerCase()](...args);
    });
  });
}

function _checkResponse(data, req, res, next) {
  res.status = ((fn) => {
    return (status) => {
      if(!data.responseCodes[status]) {
        throw new YHTTPError(500, 'E_STATUS_NOT_DECLARED', status);
      }
      return fn.call(res, status);
    };
  })(res.status);
  next();
}

module.exports = routesUtils;
