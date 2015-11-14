'use strict';

var initUserController = require('./users.controller');

module.exports = function initUsersRoutes(context) {
  var userController = initUserController(context);

  context.app.get('/api/v0/users', context.checkAuth, userController.list);
  context.app.get('/api/v0/users/:user_id', context.checkAuth, userController.get);
  context.app.put('/api/v0/users/:user_id', context.checkAuth, userController.put);
  context.app.delete('/api/v0/users/:user_id', context.checkAuth, userController.delete);
};
