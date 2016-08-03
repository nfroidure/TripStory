'use strict';

const YHTTPError = require('yhttperror');
const Ajv = require('ajv');

const routesUtils = {
  setupRoutesFromMetadata,
};

function setupRoutesFromMetadata(context, controller, metadata) {
  Object.keys(metadata).forEach((path) => {
    Object.keys(metadata[path]).forEach((method) => {
      const data = metadata[path][method];
      let args = [
        path,
      ];

      if('development' === context.env.NODE_ENV) {
        args.push(_checkResponse.bind(null, data));
      }

      args = args.concat(
        data.controllers
        .map((controllerName) => {
          return controller[controllerName];
        })
      );

      context.app[method.toLowerCase()](...args);
    });
  });
}

function _checkResponse(data, req, res, next) {
  res.status = ((fn) => {
    return (status) => {
      if(data.responseCodes) {
        if(!data.responseCodes[status]) {
          throw new YHTTPError(500, 'E_STATUS_NOT_DECLARED', status);
        }
      } else {
        if(!(data.successResponses[status] || data.errorResponses[status])) {
          throw new YHTTPError(500, 'E_STATUS_NOT_DECLARED', status);
        }
      }
      return fn.call(res, status);
    };
  })(res.status);
  res.send = ((fn) => {
    if(
      !Object.keys(data.successResponses)
        .map(key => data.successResponses[key])
        .some(successResponse => successResponse.schema)
    ) {
      return fn;
    }
    res.send = fn;
    return (payload) => {
      let ajv;

      if('string' === typeof payload) {
        return fn.call(res, payload);
      }
      ajv = new Ajv();
      res.send = fn;

      Object.keys(data.successResponses)
      .filter(key => parseInt(key, 10) === res.statusCode)
      .forEach((key) => {
        const successResponse = data.successResponses[key];

        if('entry' === successResponse.type) {
          if(!ajv.validate(successResponse.schema, payload.contents)) {
            console.log(
              'payload.contents', payload,
              'ajv.errors', ajv.errors
            );
            throw new YHTTPError(500, 'E_PAYLOAD_MALFORMED', ajv.errors, payload);
          }
        }
      });
      return fn.call(res, payload);
    };
  })(res.send);
  next();
}

module.exports = routesUtils;
