'use strict';

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var express = require('express');
var initRoutes = require('./app/routes');
var Promise = require('bluebird');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var winston = require('winston');
var Twitter = require('twitter');
var util = require('util');
var authUtils = require('http-auth-utils');
var favicon = require('serve-favicon');
var path = require('path');
var TokenService = require('sf-token');

var initFacebookWorker = require('./workers/facebook/facebook.bin.js');
var initXeeWorker = require('./workers/xee/xee.bin.js');
var initPSAWorker = require('./workers/psa/psa.bin.js');
var initTwitterWorker = require('./workers/twitter/twitter.bin.js');

var context = {};

// Preparing services
context.env = process.env;
Promise.all([
  MongoClient.connect(context.env.MONGODB_URL),
]).spread(function handleServerServices(db) {
  // Services
  context.time = Date.now.bind(Date);
  context.db = db;
  context.bus = {
    consume: function busConsume(callback) {
      process.on('bus-event', callback);
    },
    trigger: function busTrigger(event) {
      process.emit('bus-event', event);
    },
  };
  context.app = express();
  context.createObjectId = ObjectId;
  context.logger = new (winston.Logger)({
    transports: [new (winston.transports.Console)({ level: 'silly' })],
  });
  context.tokens = new TokenService({
    uniqueId: function() { return context.createObjectId().toString(); },
    secret: context.env.TOKEN_SECRET,
    time: context.time,
  });
  context.checkAuth = function isLoggedIn(req, res, next) {
    context.logger.debug('isLoggedIn', req.isAuthenticated(), req.user);
    if(req.user || req.isAuthenticated()) {
      return next();
    }
    res.sendStatus(401);
  };

  // Middlewares
  context.app.use(initCors(context));
  context.app.use(express.static(context.env.mobile_path || '../mobile/app'));
  context.app.use(bodyParser.json());
  context.app.use(bodyParser.urlencoded());
  context.app.use(cookieParser());
  context.app.use(initBasicAuth(context)); // Fix for passport granularity issue
  context.app.use(favicon(path.resolve(__dirname, 'favicon.png')));
  context.host = 'localhost';
  context.port = 3000;
  context.base = context.env.cors || 'http://' + context.host + ':' + context.port;
  context.cors = context.env.cors || 'http://' + context.host + ':8100';
  context.logger.debug('Env', context.env);

  /* / Workers
  initPSAWorker(context);
  */
  initFacebookWorker(context);
  initTwitterWorker(context);
  initXeeWorker(context);

  /* / Periodical signals
  randomRunDelay(triggerPSASync.bind(null, context), 240000);
  triggerPSASync(context);
  randomRunDelay(triggerTwitterSync.bind(null, context), 960000);
  triggerTwitterSync(context);
  randomRunDelay(triggerXEESync.bind(null, context), 240000);
  triggerXEESync(context);
  */

  // Routes
  initRoutes(context);

  // Starting the server
  return new Promise(function handleServerPromise(resolve, reject) {
    context.server = context.app.listen(context.port, function handleServerCb(err) {
      if(err) {
        return reject(err);
      }

      context.logger.debug(
        'Server listening to \\o/ -> http://%s:%s - Pid: %s',
        context.host, context.port, process.pid
      );
      resolve();
    });
  });
});

function initCors(context) {
  return function corsFunction(req, res, next) {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', context.cors);
    res.header('Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, ' +
      'X-SF-Ionic-Version, Cookies'
    );
    res.header('Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if('OPTIONS' === req.method) {
      return res.status(200).send();
    }
    next();
  };
}

function initBasicAuth(context) {
  return function(req, res, next) {
    var data;

    if(!req.headers.authorization) {
      return next();
    }
    data = authUtils.parseAuthorizationHeader(req.headers.authorization).data;

    context.db.collection('users').findOne({
      'contents.email': data.username,
      password: data.password,
    }).then(function(user) {
      if(!user) {
        context.logger.debug('Bad login attempt:', data);
        return res.sendStatus(401);
      }
      req.user = user;
      next();
    }).catch(next);
  };
}

function triggerTwitterSync(context) {
  context.bus.trigger({
    exchange: 'A_TWITTER_SYNC',
    contents: {},
  });
}

function triggerPSASync(context) {
  context.bus.trigger({
    exchange: 'A_PSA_SYNC',
    contents: {},
  });
}

function triggerXEESync(context) {
  context.bus.trigger({
    exchange: 'A_XEE_SYNC',
    contents: {},
  });
}

function randomRunDelay(fn, delay) {
  setTimeout(function() {
    fn();
    randomRunDelay(fn, delay);
  }, Math.random() * delay);
}
