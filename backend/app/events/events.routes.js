'use strict';

var initEventController = require('./events.controller');

module.exports = function initEventsRoutes(context) {
  var eventController = initEventController(context);

  context.app.get(
    '/api/v0/users/:user_id/events',
    context.checkAuth, eventController.list
  );
  context.app.get(
    '/api/v0/users/:user_id/events/:event_id',
    context.checkAuth, eventController.get
  );
  context.app.put(
    '/api/v0/users/:user_id/events/:event_id',
    context.checkAuth, eventController.put
  );
  context.app.delete(
    '/api/v0/users/:user_id/events/:event_id',
    context.checkAuth, eventController.delete
  );
};
