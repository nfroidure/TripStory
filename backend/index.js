'use strict';

if(process.env.API_ANALYTICS_KEY) { // eslint-disable-line
  var aac = require('@jbpionnier/api-analytics-client'); // eslint-disable-line
  var analytics = require('@jbpionnier/api-analytics-client/express'); // eslint-disable-line
} // eslint-disable-line

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var express = require('express');
var initRoutes = require('./app/routes');
var Promise = require('bluebird');
var winston = require('winston');
var TokenService = require('sf-token');
var nodemailer = require('nodemailer');
var nodemailerMailgunTransport = require('nodemailer-mailgun-transport');
var Pusher = require('pusher');
var Twitter = require('twitter');

var initFacebookWorker = require('./workers/facebook/facebook.bin.js');
var initXeeWorker = require('./workers/xee/xee.bin.js');
var initPSAWorker = require('./workers/psa/psa.bin.js');
var initTwitterWorker = require('./workers/twitter/twitter.bin.js');
var initEmailWorker = require('./workers/email/email.bin.js');
var initPusherWorker = require('./workers/pusher/pusher.bin.js');

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
  if(context.env.PUSHER_APP_ID) {
    context.pusher = new Pusher({
      appId: context.env.PUSHER_APP_ID,
      key: context.env.PUSHER_KEY,
      secret: context.env.PUSHER_SECRET,
      cluster: context.env.PUSHER_CLUSTER,
      encrypted: true,
    });
  }
  if(context.env.TWITTER_ID) {
    context.twitter = new Twitter({
      consumer_key: process.env.TWITTER_ID,
      consumer_secret: process.env.TWITTER_SECRET,
      access_token_key: process.env.TWITTER_ACCESS_TOKEN,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });
  }

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

  if(context.env.API_ANALYTICS_KEY) {
    context.analyticsAgent = analytics({
      apiKey: context.env.API_ANALYTICS_KEY,
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
