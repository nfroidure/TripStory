'use strict';

const routesUtils = {
  setupRoutesFromMetadata,
};

function setupRoutesFromMetadata(context, controller, metadata) {
  Object.keys(metadata).forEach((path) => {
    Object.keys(metadata[path]).forEach((method) => {
      const data = metadata[path][method];

      context.app[method.toLowerCase()](
        path,
        controller[data.controller]
      );
    });
  });
}

module.exports = routesUtils;
