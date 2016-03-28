'use strict';

var initCarController = require('./cars.controller');

module.exports = function initCarsRoutes(context) {
  var carController = initCarController(context);

  context.app.get(
    '/api/v0/cars',
    carController.list
  );
  context.app.get(
    '/api/v0/users/:user_id/cars',
    carController.list
  );
  context.app.get(
    '/api/v0/users/:user_id/cars/:car_id',
    carController.get
  );
  context.app.delete(
    '/api/v0/users/:user_id/cars/:car_id',
    carController.delete
  );
};
