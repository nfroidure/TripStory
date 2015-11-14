'use strict';

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var express = require('express');
var initRoutes = require('./app/routes');
var Promise = require('bluebird');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


// Preparing services
Promise.all([
  MongoClient.connect(process.env.MONGODB_URL),
]).spread(function handleServerServices(db) {
  var context = {};

  // Services
  context.db = db;
  context.app = express();
  context.createObjectId = ObjectId;
  context.castToObjectId = ObjectId;
  context.checkAuth = function isLoggedIn(req, res, next) {
    console.log('isLoggedIn', req.isAuthenticated(), req.user);
    if(req.user || req.isAuthenticated()) {
      return next();
    }
    res.sendStatus(401);
  };

  // Middlewares
  context.app.use(express.static('www'));
  context.app.use(bodyParser.json());
  context.app.use(cookieParser());
  context.host = 'localhost';
  context.port = 3000;

  // Routes
  initRoutes(context);

  // Starting the server
  return new Promise(function handleServerPromise(resolve, reject) {
    context.server = context.app.listen(context.port, function handleServerCb(err) {
      if(err) {
        return reject(err);
      }

      console.log('Patrick is here -> http://%s:%s', context.host, context.port);
      resolve();
    });
  });

});
