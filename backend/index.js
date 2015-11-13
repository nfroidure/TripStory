'use strict';

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var express = require('express');
var initRoutes = require('./app/routes');
var Promise = require('bluebird');
var bodyParser = require('body-parser');

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

  // Middlewares
  context.app.use(bodyParser.json());

  // Routes
  initRoutes(context);

  // Starting the server
  return new Promise(function handleServerPromise(resolve, reject) {
    context.server = context.app.listen(3000, function handleServerCb(err) {
      if(err) {
        return reject(err);
      }
      context.host = context.server.address().address;
      context.port = context.server.address().port;

      console.log('Patrick is here -> http://%s:%s', context.host, context.port);
      resolve();
    });
  });

});
