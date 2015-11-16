'use strict';

var request = require('request');

var SERVER = 'https://cloud.xee.com/v1/';
var CLIENT_ID = 'oWQQcef8pZ7hRaC7LXY3';
var CLIENT_SECRET = 'G8Q6hoEv8z8M8hB1wI4T';
var xeeJobs = {
  A_XEE_SYNC: xeeSyncJob,
};

module.exports = xeeJobs;

function xeeSyncJob(context, event) {
  return context.db.collection('users').find({
    'auth.psa': { $exists: true },
  }).toArray()
  .then(function handleXeeUsers(users) {
    // For each user retrieve current GPS location
    // Check for nice places around if the vehicle is stopped
    // Save the location event with some useful informations
  });
}
