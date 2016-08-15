'use strict';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const express = require('express');
const path = require('path');

const initCors = require('./system/cors.middleware');
const initAgentVersionChecker = require('./system/version.middleware');
const initAuthenticationRoutes = require('./authentication/authentication.routes');
const initOAuthRoutes = require('./authentication/oauth.routes');
const initTripsRoutes = require('./trips/trips.routes');
const initEventsRoutes = require('./events/events.routes');
const initUsersRoutes = require('./users/users.routes');
const initCarsRoutes = require('./cars/cars.routes');
const initDocRoutes = require('./docs/docs.routes');
const initSystemRoutes = require('./system/system.routes');

module.exports = initRoutes;


function initRoutes(context) {

  // Middlewares
  if(context.env.CORS) {
    context.app.use(initCors(context));
  }
  if(context.env.AGENTS) {
    context.app.use(initAgentVersionChecker(context));
  }
  // context.app.use('/swagger', express.static(`${__dirname}/../public`));
  context.app.use('/swagger', express.static(`${__dirname}/../node_modules/swagger-ui/dist`));
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

  if(context.analyticsAgent) {
    context.app.use(context.analyticsAgent);
  }

  // API
  initAuthenticationRoutes(context);
  initOAuthRoutes(context);
  initUsersRoutes(context);
  initTripsRoutes(context);
  initEventsRoutes(context);
  initCarsRoutes(context);
  initDocRoutes(context);
  initSystemRoutes(context); // Must be the last (contains the catch all middleware)

}
