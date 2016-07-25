'use strict';

const extend = require('extend');
const project = require('../package.json');
const authenticationMetadata = require('../app/authentication/authentication.metadata');
const oauthMetadata = require('../app/authentication/oauth.metadata');
const carsMetadata = require('../app/cars/cars.metadata');
const eventsMetadata = require('../app/events/events.metadata');
const systemMetadata = require('../app/system/system.metadata');
const tripsMetadata = require('../app/trips/trips.metadata');
const usersMetadata = require('../app/users/users.metadata');

let api = {};

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

process.stdout.write(JSON.stringify(api, null, 2));

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
      definition.responses = Object.keys(data.responseCodes)
      .reduce((responses, status) => {
        responses[status] = {};
        responses[status].description = data.responseCodes[status].description;
        return responses;
      }, {});

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
