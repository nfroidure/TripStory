'use strict';

const project = require('../package.json');
const context = {
  app: {
    get: () => {},
    post: () => {},
    put: () => {},
    delete: () => {},
  },
};
const routes = require('../app/events/events.routes.js')(context);

let api = {};

api.swagger = '2.0';
api.info = {
  title: project.name,
  description: project.description,
  version: project.version,
};
api.basePath = '/api/v0';
api.paths = {};

routes.forEach((route) => {
  api.paths[route.path] = {};
  api.paths[route.path][route.method.toLowerCase()] = {};
  api.paths[route.path][route.method.toLowerCase()].parameters = [];
  api.paths[route.path][route.method.toLowerCase()].responses = {};

  route.responseCodes.forEach((response) => {
    api.paths[route.path][route.method.toLowerCase()].responses[response] = {
      description: '',
    };
  });
});

process.stdout.write(JSON.stringify(api));
