'use strict';

var initEventsRoutes = require('./events/events.routes');
var initUsersRoutes = require('./users/users.routes');
var initAuthenticationRoutes = require('./authentication/authentication.routes')

module.exports = initRoutes;


function initRoutes(context) {

    initAuthenticationRoutes(context);
    initUsersRoutes(context);
    initEventsRoutes(context);

}
