'use strict';

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var favicon = require('serve-favicon');
var express = require('express');
var path = require('path');

var initBasicAuth = require('./authentication/authentication.middleware');
var initCors = require('./system/cors.middleware');
var initAuthenticationRoutes = require('./authentication/authentication.routes');
var initTripsRoutes = require('./trips/trips.routes');
var initEventsRoutes = require('./events/events.routes');
var initUsersRoutes = require('./users/users.routes');
var initCarsRoutes = require('./cars/cars.routes');
var initSystemRoutes = require('./system/system.routes');

module.exports = initRoutes;


function initRoutes(context) {

  // Middlewares
  if(context.env.CORS) {
    context.app.use(initCors(context));
  }
  if(context.env.STATIC_PATH) {
    context.app.use(express.static(path.join(
      process.cwd(),
      context.env.STATIC_PATH
    )));
    context.logger.info('Static files path is set:', context.env.STATIC_PATH);
  } else {
    context.logger.error('Static files path is not set!');
  }
  if(context.env.FAVICON_PATH) {
    context.app.use(favicon(path.join(
      process.cwd(),
      context.env.FAVICON_PATH
    )));
    context.logger.info('Favicon path is set:', context.env.FAVICON_PATH);
  } else {
    context.logger.error('Favicon path is not set!');
  }
  context.app.use(bodyParser.json());
  context.app.use(bodyParser.urlencoded({
    extended: false,
  }));
  context.app.use(cookieParser(context.env.SESSION_SECRET));
  context.app.use(initBasicAuth(context)); // Fix for passport granularity issue

  // API
  initAuthenticationRoutes(context);
  initUsersRoutes(context);
  initTripsRoutes(context);
  initEventsRoutes(context);
  initCarsRoutes(context);
  initSystemRoutes(context);

}
