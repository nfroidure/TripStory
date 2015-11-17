'use strict';

var initCarController = require('./cars.controller');

module.exports = function initCarsRoutes(context) {
  var carController = initCarController(context);

  context.app.get(
    '/api/v0/users/:user_id/cars',
    context.checkAuth, carController.list
  );
  context.app.get(
    '/api/v0/users/:user_id/cars/:car_id',
    context.checkAuth, carController.get
  );/*
  context.app.put(
    '/api/v0/users/:user_id/cars/:car_id',
    context.checkAuth, carController.put
  );
  context.app.delete(
    '/api/v0/users/:user_id/cars/:car_id',
    context.checkAuth, carController.delete
  );*/
};
