'use strict';

var initUserController = require('./users.controller');

module.exports = function initUsersRoutes(context) {
  var userController = initUserController(context);

  context.app.get('/api/v0/users', userController.list);
  context.app.get('/api/v0/users/:user_id', userController.get);
  context.app.put('/api/v0/users/:user_id', userController.put);
  context.app.delete('/api/v0/users/:user_id', userController.delete);
  context.app.get('/api/v0/users/:user_id/friends', userController.listFriends);
};
