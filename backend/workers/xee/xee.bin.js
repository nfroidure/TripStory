'use strict';

var jobs = require('./xee.jobs.js');

// One day, i'll be a real process!!! Let just be a lib now :)
module.exports = function initXEEWorker(context) {
  context.bus.consume(function psaConsumer(event) {
    if(jobs[event.exchange]) {
      context.logger.debug('New XEE Event', event);
      jobs[event.exchange](context, event)
      .then(function xeeError() {
        context.logger.debug('Successfully processed event', event);
      })
      .catch(function xeeSuccess(err) {
        context.logger.error('Error while processing event', event, err);
      });
    }
  });
};
