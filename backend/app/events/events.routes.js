'use strict';

const initEventController = require('./events.controller');

module.exports = function initEventsRoutes(context) {
  var eventController = initEventController(context);
  var apiPrefix = '/api/v0';
  var routes = [
    {
      method: 'GET',
      path: '/events',
      controller: eventController.list,
      requestBody: '',
      requestQuery: [],
      responseBody: 'eventLists',
      responseCodes: [200, 500],
    },
    {
      method: 'GET',
      path: '/users/:user_id/events',
      controller: eventController.list,
      requestBody: '',
      requestQuery: [],
      responseBody: 'eventLists',
      responseCodes: [200, 500],
    },
    {
      method: 'GET',
      path: '/users/:user_id/events/:event_id',
      controller: eventController.get,
      requestBody: '',
      requestQuery: [],
      responseBody: 'event',
      responseCodes: [200, 500],
    },
    {
      method: 'PUT',
      path: '/users/:user_id/events/:event_id',
      controller: eventController.put,
      requestBody: '',
      requestQuery: [],
      responseBody: 'event',
      responseCodes: [200, 500],
    },
    {
      method: 'DELETE',
      path: '/users/:user_id/events/:event_id',
      controller: eventController.delete,
      requestBody: '',
      requestQuery: [],
      responseBody: 'event',
      responseCodes: [200, 500],
    },
  ];

  routes
    .map(function setPrefix(route) {
      route.path = apiPrefix + route.path;

      return route;
    })
    .forEach(function initRoute(route) {
      context.app[route.method.toLowerCase()](
        route.path,
        route.controller
      );
    })
  ;

  /*
  context.app.get(
    '/api/v0/events',
    eventController.list
  );
  context.app.get(
    '/api/v0/users/:user_id/events',
    eventController.list
  );
  context.app.get(
    '/api/v0/users/:user_id/events/:event_id',
    eventController.get
  );
  context.app.put(
    '/api/v0/users/:user_id/events/:event_id',
    eventController.put
  );
  context.app.delete(
    '/api/v0/users/:user_id/events/:event_id',
    eventController.delete
  );
  */

  return routes;
};
