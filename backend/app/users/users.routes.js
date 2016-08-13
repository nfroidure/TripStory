'use strict';

const routesUtils = require('../utils/routes');
const userMetadata = require('./users.metadata');
const initUserController = require('./users.controller');

module.exports = function initUsersRoutes(context) {
  const userController = initUserController(context);

  routesUtils.setupRoutesFromMetadata(context, userController, userMetadata);
};
