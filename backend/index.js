'use strict';

var aac = require('@jbpionnier/api-analytics-client'); // eslint-disable-line

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var express = require('express');
var initRoutes = require('./app/routes');
var Promise = require('bluebird');
var winston = require('winston');
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
    uniqueId: function createTokenUniqueId() {
      return context.createObjectId().toString();
    },
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

  context.protocol = context.env.PROTOCOL || 'http';
  context.host = context.env.HOST || 'localhost';
  context.domain = context.env.DOMAIN || '';
  context.port = 'undefined' !== typeof context.env.PORT ?
    parseInt(context.env.PORT, 10) :
    3000;
  context.base = context.protocol + '://' + (
    context.domain ?
    context.domain :
    context.host + ':' + context.port
  );
  context.logger.debug('Env', context.env);

  // Workers
  initPSAWorker(context);
  initFacebookWorker(context);
  initTwitterWorker(context);
  initXeeWorker(context);

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
