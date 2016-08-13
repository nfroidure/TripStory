'use strict';

const extend = require('extend');
const project = require('../../package.json');
const reaccess = require('express-reaccess');
const authenticationMetadata = require('../authentication/authentication.metadata');
const oauthMetadata = require('../authentication/oauth.metadata');
const carsMetadata = require('../cars/cars.metadata');
const eventsMetadata = require('../events/events.metadata');
const systemMetadata = require('../system/system.metadata');
const tripsMetadata = require('../trips/trips.metadata');
const usersMetadata = require('../users/users.metadata');
const docsMetadata = require('../docs/docs.metadata');
const metadataUtils = require('../utils/metadata');
const REACCESS_CONFIG = require('../authentication/authentication.utils').REACCESS_CONFIG;

module.exports = initDocsController;

function initDocsController(context) {
  const docsController = {
    redirect: docsControllerRedirect,
    get: docsControllerGet,
    getConfiguration: docsControllerGetConfiguration,
  };

  return docsController;

  function docsControllerRedirect(req, res) {
    res.redirect(
      302,
      context.base + '/swagger/' +
      '?url=' + context.base + metadataUtils.apiPrefix + (
        req.user ? 'users/' + req.user._id.toString() + '/' : ''
      ) + 'docs'
    );
  }

  function docsControllerGet(req, res, next) {
    Promise.resolve().then(() => {
      const rights = reaccess.getRightsFromReq(REACCESS_CONFIG.rightsProps, req);
      const values = reaccess.getValuesFromReq(REACCESS_CONFIG.valuesProps, req);
      const api = {};
      let paths = {};

      api.swagger = '2.0';
      api.info = {
        title: project.name,
        description: project.description,
        version: project.version,
      };
      api.securityDefinitions = {
        basic: {
          type: 'basic',
        },
        // Maybe a valid approach to declaring JWT Auth
        // https://github.com/swagger-api/swagger-ui/pull/2234
        // But, looks like there is no consensus tight now:
        // https://github.com/swagger-api/swagger-ui/pull/2234
        bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      };

      paths = {};
      paths = extend(paths, _buildPathsFromMetadata(authenticationMetadata));
      paths = extend(paths, _buildPathsFromMetadata(oauthMetadata));
      paths = extend(paths, _buildPathsFromMetadata(carsMetadata));
      paths = extend(paths, _buildPathsFromMetadata(eventsMetadata));
      paths = extend(paths, _buildPathsFromMetadata(systemMetadata));
      paths = extend(paths, _buildPathsFromMetadata(tripsMetadata));
      paths = extend(paths, _buildPathsFromMetadata(usersMetadata));
      paths = extend(paths, _buildPathsFromMetadata(docsMetadata));

      if(req.params.user_id) {
        api.paths = Object.keys(paths)
        .reduce((filteredPaths, path) => {
          // This is an ugly way to fill templated values, best would be
          // to do a match between patterns but way complexer :/
          let finalPath = path.replace('{user_id}', req.user._id.toString());
          let methods = Object.keys(paths[path])
            .reduce((filteredMethods, method) => {
              if(reaccess.test(rights, values, method, finalPath)) {
                filteredMethods[method] = paths[path][method];
              }
              return filteredMethods;
            }, {});

          if(Object.keys(methods).length) {
            filteredPaths[finalPath] = methods;
          }

          return filteredPaths;
        }, {});
      } else {
        api.paths = paths;
      }

      res.status(200).json(api);
    }).catch(next);
  }

  function docsControllerGetConfiguration(req, res, next) {
    Promise.resolve()
      .then(() => {
        res.status(200).json({
          url: `${context.base}${metadataUtils.apiPrefix}${(
            req.user ? `users/${req.user._id.toString()}/`: ''
          )}docs`,
        });
      })
      .catch(next)
    ;
  }

}

function _buildPathsFromMetadata(metadata) {
  return Object.keys(metadata).reduce((paths, path) => {
    return Object.keys(metadata[path]).reduce((paths, method) => {
      const data = metadata[path][method];
      const definition = {};
      const { path: swaggerPath, parameters } = _getPathsAndParams(path);

      paths[swaggerPath] = paths[swaggerPath] || {};
      paths[swaggerPath][method.toLowerCase()] = definition;

      definition.originalPath = path;
      definition.summary = data.summary;
      definition.parameters = parameters.concat(data.parameters);
      definition.tags = data.tags;
      if(data.responseCodes) {
        definition.responses = Object.keys(data.responseCodes)
        .reduce((responses, status) => {
          responses[status] = {};
          responses[status].description = data.responseCodes[status].description;
          return responses;
        }, {});
      } else {
        definition.responses = _setSuccessResponses(
          data.successResponses,
          {}
        );
        definition.responses = _setErrorResponses(
          data.errorResponses,
          definition.responses
        );
      }

      return paths;
    }, paths);
  }, {});
}

function _getPathsAndParams(path) {
  const parameters = [];

  path = path.replace(/(?:\/):([a-z_]+)(?=\/|$)/mg, (match, $1) => {
    const isObjectId = '_id' === $1.substr(-3);
    const parameter = {
      name: $1,
      in: 'path',
      description: isObjectId ?
        $1[0].toUpperCase() + $1.substr(1, $1.length - '_id'.length - 1) +
          ' MongoDB ObjectId.' :
        '',
      required: false,
      type: 'string',
    };

    parameter.pattern = '[a-z0-9]{24}';
    parameters.push(parameter);
    return '/{' + $1 + '}';
  });
  return { path, parameters };
}

function _setSuccessResponses(successResponses, responses) {
  return Object.keys(successResponses).reduce((responses, status) => {
    responses[status] = {
      description: successResponses[status].description || '',
    };
    if('collection' === successResponses[status].type) {
      responses[status].schema = {
        type: 'object',
        additionalProperties: true,
        required: ['entries'],
        properties: {
          entries: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
              required: ['contents'],
              properties: {
                contents: successResponses[status].schema,
              },
            },
          },
        },
      };
    } else if('entry' === successResponses[status].type) {
      responses[status].schema = {
        type: 'object',
        additionalProperties: true,
        required: ['contents'],
        properties: {
          contents: successResponses[status].schema,
        },
      };
    } else if('raw' === successResponses[status].type) {
      responses[status].schema = successResponses[status].schema;
    }
    return responses;
  }, responses);
}

function _setErrorResponses(errorResponses, responses) {
  return Object.keys(errorResponses).reduce((responses, status) => {
    responses[status] = {
      description: errorResponses[status].description || '',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['code'],
        properties: {
          code: {
            type: 'string',
            enum: errorResponses[status].codes,
          },
          stack: {
            type: 'string',
          },
        },
      },
    };
    return responses;
  }, responses);
}
