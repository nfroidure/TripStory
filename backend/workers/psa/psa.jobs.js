'use strict';

var request = require('request');

var SERVER = 'https://graph.facebook.com/';
var CLIENT_ID = '3636b9ef-0217-4962-b186-f0333117ddcd';
var CLIENT_SECRET = 'C1xV6pC3yX7cB3jV8oM6tW4vK2mU7fV0nT6eB2fG2fO4mT7gS0';
var facebookJobs = {
  A_PSA_SYNC: psaSyncJob,
};

module.exports = facebookJobs;

function psaSyncJob(context, event) {
  return context.db.collection('users').findOne({
    _id: event.contents.user_id,
  })
  .then(function(user) {
    if(!(user.psa && user.psa.vin)) {
      return;
    }
    // Process datas and retrieve events
  });
}
