'use strict';

var initEventController = require('./events.controller');

module.exports = function initEventsRoutes(context) {
  var eventController = initEventController(context);

  context.app.get('/api/v0/events', context.checkAuth, eventController.list);
  context.app.get('/api/v0/events/:event_id', context.checkAuth, eventController.get);
  context.app.put('/api/v0/events/:event_id', context.checkAuth, eventController.put);
  context.app.delete('/api/v0/events/:event_id', context.checkAuth, eventController.delete);
};
