'use strict';

var jobs = require('./email.jobs.js');

// One day, i'll be a real process!!! Let just be a lib now :)
module.exports = function initEmailWorker(context) {
  context.bus.consume(function emailConsumer(event) {
    if(jobs[event.exchange]) {
      context.logger.debug('New Email Event', event);
      jobs[event.exchange](context, event)
      .then(function emailError() {
        context.logger.debug('Successfully processed event', event);
      })
      .catch(function emailSuccess(err) {
        context.logger.error('Error while processing event', event, err);
      });
    }
  });
};
