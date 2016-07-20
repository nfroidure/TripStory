'use strict';

const initEventController = require('./events.controller');

module.exports = function initEventsRoutes(context) {
  const eventController = initEventController(context);
  const apiPrefix = '/api/v0';
  const routes = [
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
    .forEach((route) => {
      context.app[route.method.toLowerCase()](
        apiPrefix + route.path,
        route.controller
      );
    })
  ;

  return routes;
};
