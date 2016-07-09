'use strict';

const jobs = require('./facebook.jobs.js');

// One day, i'll be a real process!!! Let just be a lib now :)
module.exports = function initFacebookWorker(context) {
  context.bus.consume(function facebookConsumer(event) {
    if(jobs[event.exchange]) {
      context.logger.debug('New Facebook Event', event);
      jobs[event.exchange](context, event)
      .then(function facebookError() {
        context.logger.debug('Successfully processed event', event);
      })
      .catch(function facebookSuccess(err) {
        context.logger.error('Error while processing event', event, err);
      });
    }
  });
};
