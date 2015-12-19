'use strict';

var initAuthenticationRoutes = require('./authentication/authentication.routes');
var initTripsRoutes = require('./trips/trips.routes');
var initEventsRoutes = require('./events/events.routes');
var initUsersRoutes = require('./users/users.routes');
var initCarsRoutes = require('./cars/cars.routes');
var transformsUtils = require('./utils/transforms');

module.exports = initRoutes;


function initRoutes(context) {

  initAuthenticationRoutes(context);
  initUsersRoutes(context);
  initTripsRoutes(context);
  initEventsRoutes(context);
  initCarsRoutes(context);

  context.app.get('/ping', function(req, res) {
    res.sendStatus(200);
  });

  context.app.post('/bus', function triggerEvent(req, res) {
    context.bus.trigger(transformsUtils.toCollection(req.body));
    res.status(200).json(req.body);
  });
}
