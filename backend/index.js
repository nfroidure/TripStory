'use strict';

if(process.env.API_ANALYTICS_KEY) { // eslint-disable-line
  var aac = require('@jbpionnier/api-analytics-client'); // eslint-disable-line
  var analytics = require('@jbpionnier/api-analytics-client/express'); // eslint-disable-line
} // eslint-disable-line

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var express = require('express');
var passport = require('passport');
var initRoutes = require('./app/routes');
var Promise = require('bluebird');
var winston = require('winston');
var TokenService = require('sf-token');
var nodemailer = require('nodemailer');
var nodemailerMailgunTransport = require('nodemailer-mailgun-transport');
var Pusher = require('pusher');
var redis = require("redis");
var cloudinary = require("cloudinary");


var initFacebookWorker = require('./workers/facebook/facebook.bin.js');
var initXeeWorker = require('./workers/xee/xee.bin.js');
var initPSAWorker = require('./workers/psa/psa.bin.js');
var initTwitterWorker = require('./workers/twitter/twitter.bin.js');
var initEmailWorker = require('./workers/email/email.bin.js');
var initPusherWorker = require('./workers/pusher/pusher.bin.js');
var initIpinfoWorker = require('./workers/ipinfo/ipinfo.bin.js');

var context = {};

require('winston-loggly');

// Preparing services
context.env = process.env;
context.logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: context.env.LOG_LEVEL,
    }),
  ].concat(
    context.env.LOGGLY_TOKEN ?
    [new winston.transports.Loggly({
      level: context.env.LOGGLY_LEVEL || context.env.LOG_LEVEL,
      token: context.env.LOGGLY_TOKEN,
      subdomain: context.env.LOGGLY_SUBDOMAIN,
      auth: {
        username: context.env.LOGGLY_USERNAME,
        password: context.env.LOGGLY_PASSWORD,
      },
    })] :
    []
  ),
});
Promise.all([
  // Configuration to avoid wierd Mongo Error in production
  // No F*** idea what i'm doing...
  // http://stackoverflow.com/questions/30909492/mongoerror-topology-was-destroyed
  MongoClient.connect(context.env.MONGODB_URL, {
    server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
  }),
]).spread(function handleServerServices(db) {
  // Services
  context.time = Date.now.bind(Date);
  context.db = db;
  context.passport = passport;
  // Emulate a message queueing system
  context.bus = {
    consume: function busConsume(callback) {
      process.on('bus-event', callback);
    },
    trigger: function busTrigger(event) {
      process.emit('bus-event', event);
    },
  };
  if(context.env.CLOUDINARY_URL) {
    context.cloudinary = cloudinary;
  }
  if(context.env.REDIS_HOST) {
    // Use redis as the key/value store
    context.store = (function initRedisStore() {
      var client = redis.createClient(
        context.env.REDIS_PORT,
        context.env.REDIS_HOST, {
          no_ready_check: true,
        }
      );
      client.auth(context.env.REDIS_PASSWORD, function(err) {
        if(err) {
          context.logger.error('Redis error:', err.stack);
        }
      });

      client.on('connect', function() {
        context.logger.info('Connected to Redis');
      });

      client.on('error', function redisErrorHandler(err) {
        context.logger.error('Redis error:', err.stack);
      });
      return {
        set: function storeSet(key, value) {
          return new Promise(function(resolve, reject) {
            client.set(key, new Buffer(value.toString()), function(err) {
              if(err) {
                return reject(err);
              }
              resolve();
            });
          });
        },
        get: function storeGet(key) {
          return new Promise(function(resolve, reject) {
            client.get(key, function(err, buffer) {
              if(err) {
                return reject(err);
              }
              resolve(buffer ? buffer.toString('utf-8') : {}.undef);
            });
          });
        },
      };
    }());
  } else {
    // Emulate a key/value store
    context.store = (function initStore(store) {
      return {
        set: function storeSet(key, value) {
          store[key] = value;
          return Promise.resolve();
        },
        get: function storeGet(key) {
          return Promise.resolve(store[key]);
        },
      };
    }({}));
  }
  if(context.env.PUSHER_APP_ID) {
    context.pusher = new Pusher({
      appId: context.env.PUSHER_APP_ID,
      key: context.env.PUSHER_KEY,
      secret: context.env.PUSHER_SECRET,
      cluster: context.env.PUSHER_CLUSTER,
      encrypted: true,
    });
  }

  context.app = express();
  context.createObjectId = ObjectId;
  context.tokens = new TokenService({
    uniqueId: function createTokenUniqueId() {
      return context.createObjectId().toString();
    },
    secret: context.env.TOKEN_SECRET,
    time: context.time,
  });

  if(context.env.API_ANALYTICS_KEY) {
    context.analyticsAgent = analytics({
      prefix: '/api',
      uuidResolver: function agentUuidResolver(req) {
        return req.user && req.user._id ? req.user._id.toString() : null;
      },
    });
  }

  if(context.env.MAILGUN_KEY && context.env.MAILGUN_DOMAIN) {

    context.sendMail = function initSendMail() {
      var mailer = nodemailer.createTransport(
        nodemailerMailgunTransport({
          auth: {
            api_key: context.env.MAILGUN_KEY,
            domain: context.env.MAILGUN_DOMAIN,
          },
        })
      );

      return function sendEmail(contents) {
        return new Promise(function(resolve, reject) {
          mailer.sendMail(contents, function sendMailHandler(err, info) {
            if(err) {
              return reject(err);
            }
            resolve(info);
          });
        });
      };
    }();
  }

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
  if(context.env.MAILGUN_KEY && context.env.MAILGUN_DOMAIN) {
    initEmailWorker(context);
  }
  if(context.env.PUSHER_APP_ID) {
    initPusherWorker(context);
  }
  initIpinfoWorker(context);

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
