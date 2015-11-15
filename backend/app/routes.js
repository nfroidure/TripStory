'use strict';

var initAuthenticationRoutes = require('./authentication/authentication.routes');
var initTripsRoutes = require('./trips/trips.routes');
var initEventsRoutes = require('./events/events.routes');
var initUsersRoutes = require('./users/users.routes');

module.exports = initRoutes;


function initRoutes(context) {

  initAuthenticationRoutes(context);
  initUsersRoutes(context);
  initTripsRoutes(context);
  initEventsRoutes(context);

}
