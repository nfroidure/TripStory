'use strict';

const routesUtils = require('../utils/routes');
const docMetadata = require('./docs.metadata');
const initDocController = require('./docs.controller');

module.exports = function initDocsRoutes(context) {
  const docController = initDocController(context);

  routesUtils.setupRoutesFromMetadata(context, docController, docMetadata);
};
