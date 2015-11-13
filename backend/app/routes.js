'use strict';

var initEventsRoutes = require('./events/events.routes');

module.exports = initRoutes;


function initRoutes(context) {

  initEventsRoutes(context);

}
