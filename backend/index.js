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

// Twitter logger transport
var TwittLog = exports.TwittLog = function TwittLog(options) {
  this.client = new Twitter(options || {});
};

util.inherits(TwittLog, winston.Transport);
TwittLog.prototype.log = function log(level, msg, meta, callback) {
  var self = this; // eslint-disable-line

  // Dont log sensible infos
  if(-1 !== ['debug', 'error'].indexOf(level)) {
    return callback(null, true);
  }

  msg = '[' + level + '] ' + msg.substring(0, 128) + '… #jdmc15';
  this.client.post('statuses/update', { status: msg }, function twitterCb(error) {
    if (error) {
      console.log('Twitter console', error); // eslint-disable-line
      // context.logger.error(error); // eslint-disable-line no-console
      // self.emit('error', error); Disable since it crashes the app
    }
  });

  this.emit('logged');

  callback(null, true);
};
// Preparing services
Promise.all([
  MongoClient.connect(process.env.MONGODB_URL),
]).spread(function handleServerServices(db) {
  var context = {};

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
  context.castToObjectId = ObjectId;
  context.logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ level: 'silly' }),
      new (TwittLog)({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_TOKEN_SECRET,
      }
      ),
    ],
  });
  context.tokens = new TokenService({
    uniqueId: function() { return context.createObjectId().toString(); },
    secret: process.env.TOKEN_SECRET,
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
  context.app.use(express.static(process.env.mobile_path || '../mobile/app'));
  context.app.use(bodyParser.json());
  context.app.use(bodyParser.urlencoded());
  context.app.use(cookieParser());
  context.app.use(initBasicAuth(context)); // Fix for passport granularity issue
  context.app.use(favicon(path.resolve(__dirname, 'favicon.png')));
  context.host = 'localhost';
  context.port = 3000;
  context.base = process.env.cors || 'http://' + context.host + ':' + context.port;
  context.cors = process.env.cors || 'http://' + context.host + ':8100';
  context.logger.debug('Env', process.env);

  // Workers
  initFacebookWorker(context);
  initXeeWorker(context);
  initPSAWorker(context);
  initTwitterWorker(context);

  // Periodical signals
  //randomRunDelay(triggerPSASync.bind(null, context), 240000);
  //triggerPSASync(context);
  randomRunDelay(triggerXEESync.bind(null, context), 240000);
  triggerXEESync(context);
  randomRunDelay(triggerTwitterSync.bind(null, context), 960000);
  triggerTwitterSync(context);

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
