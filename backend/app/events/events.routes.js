'use strict';

var initEventController = require('./events.controller');

module.exports = function initEventsRoutes(context) {
  var eventController = initEventController(context);

  context.app.get('/api/v0/events', eventController.list);
  context.app.get('/api/v0/events/:event_id', eventController.get);
  context.app.put('/api/v0/events/:event_id', eventController.put);
  context.app.delete('/api/v0/events/:event_id', eventController.delete);
};
