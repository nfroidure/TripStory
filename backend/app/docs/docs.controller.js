'use strict';

const extend = require('extend');
const project = require('../../package.json');
const authenticationMetadata = require('../authentication/authentication.metadata');
const oauthMetadata = require('../authentication/oauth.metadata');
const carsMetadata = require('../cars/cars.metadata');
const eventsMetadata = require('../events/events.metadata');
const systemMetadata = require('../system/system.metadata');
const tripsMetadata = require('../trips/trips.metadata');
const usersMetadata = require('../users/users.metadata');
const docsMetadata = require('../docs/docs.metadata');
const metadataUtils = require('../utils/metadata');

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
      301,
      context.base + '/swagger/' +
      '?url=' + context.base + metadataUtils.apiPrefix + (
        req.user ? 'users/' + req.user._id.toString() + '/' : ''
      ) + 'docs'
    );
  }

  function docsControllerGet(req, res, next) {
    Promise.resolve().then(() => {
      const api = {};

      api.swagger = '2.0';
      api.info = {
        title: project.name,
        description: project.description,
        version: project.version,
      };
      api.paths = {};
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

      api.paths = _buildPathsFromMetadata(authenticationMetadata);
      api.paths = extend(api.paths, _buildPathsFromMetadata(oauthMetadata));
      api.paths = extend(api.paths, _buildPathsFromMetadata(carsMetadata));
      api.paths = extend(api.paths, _buildPathsFromMetadata(eventsMetadata));
      api.paths = extend(api.paths, _buildPathsFromMetadata(systemMetadata));
      api.paths = extend(api.paths, _buildPathsFromMetadata(tripsMetadata));
      api.paths = extend(api.paths, _buildPathsFromMetadata(usersMetadata));
      api.paths = extend(api.paths, _buildPathsFromMetadata(docsMetadata));

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
