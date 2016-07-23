'use strict';

const project = require('../package.json');
const eventsMetadata = require('../app/events/events.metadata.js');

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

api.paths = _buildPathsFromMetadata(eventsMetadata);

function _buildPathsFromMetadata(metadata) {
  return Object.keys(metadata).reduce((paths, path) => {
    return Object.keys(metadata[path]).reduce((paths, method) => {
      const data = metadata[path][method];
      const definition = {};

      paths[path] = paths[path] || {};
      paths[path][method.toLowerCase()] = definition;

      definition.parameters = [];
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

process.stdout.write(JSON.stringify(api, null, 2));
