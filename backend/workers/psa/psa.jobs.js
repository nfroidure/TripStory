'use strict';

var request = require('request');

var SERVER = 'https://api.mpsa.com/bgd/jdmc/1.0/';
var CLIENT_ID = '3636b9ef-0217-4962-b186-f0333117ddcd';
var CLIENT_SECRET = 'C1xV6pC3yX7cB3jV8oM6tW4vK2mU7fV0nT6eB2fG2fO4mT7gS0';
var psaJobs = {
  A_PSA_SYNC: psaSyncJob,
  A_PSA_SIGNUP: psaSignupJob,
};

module.exports = psaJobs;

function psaSyncJob(context, event) {
  return context.db.collection('users').find({
    'auth.psa': { $exists: true },
  }).toArray()
  .then(function handlePSAUsers(users) {
    // Sample: https://api.mpsa.com/bgd/jdmc/1.0/place/lastposition/VF7NC9HD8DY611112?contract=620028501&listsecond=6,12,18,24,30,36,42,48,54,60&client_id=3636b9ef-0217-4962-b186-f0333117ddcd
    // For each user retrieve current GPS location
    // Check for nice places around if the vehicle is stopped
    // Save the location event with some useful informations
  });
}

function psaSignupJob(context, event) {
  return context.db.collection('users').findOne({
    _id: event.contents.user_id,
  })
  .then(function handlePSASignup(user) {
    // Sample: https://api.mpsa.com/bgd/jdmc/1.0/vehicle/information/VF7NC9HD8DY611112?contract=620028501&listsecond=6,12,18,24,30,36,42,48,54,60&client_id=3636b9ef-0217-4962-b186-f0333117ddcd
    // Get the user car specs, save the color to customize the app
    // The event should be triggered at signup for one of the signup mechanisms
  });
}
