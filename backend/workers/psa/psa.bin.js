'use strict';

var jobs = require('./psa.jobs.js');

// One day, i'll be a real process!!! Let just be a lib now :)
module.exports = function initPSAWorker(context) {
  context.bus.consume(function psaConsumer(event) {
    context.logger.debug('New PSA Event', event);
    if(jobs[event.exchange]) {
      jobs[event.exchange](context, event)
      .then(function psaError() {
        context.logger.debug('Successfully processed event', event);
      })
      .catch(function psaSuccess(err) {
        context.logger.error('Error while processing event', event, err);
      });
    }
  });
};
