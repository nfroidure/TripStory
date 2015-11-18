'use strict';

var initAuthenticationRoutes = require('./authentication/authentication.routes');
var initTripsRoutes = require('./trips/trips.routes');
var initEventsRoutes = require('./events/events.routes');
var initUsersRoutes = require('./users/users.routes');
var initCarsRoutes = require('./cars/cars.routes');
var transformsUtils = require('./utils/transforms');
var castToObjectId = require('mongodb').ObjectId;

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
    context.bus.trigger(transformsUtils.mapIds(castToObjectId, req.body));
    res.send(200);
  });
}
