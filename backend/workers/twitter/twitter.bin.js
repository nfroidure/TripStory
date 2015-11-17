'use strict';

var jobs = require('./twitter.jobs.js');

// One day, i'll be a real process!!! Let just be a lib now :)
module.exports = function initTwitterWorker(context) {
  context.bus.consume(function twitterConsumer(event) {
    if(jobs[event.exchange]) {
      context.logger.debug('New Twitter Event', event);
      jobs[event.exchange](context, event)
      .then(function twitterError() {
        context.logger.debug('Successfully processed event', event);
      })
      .catch(function twitterSuccess(err) {
        context.logger.error('Error while processing event', event, err);
      });
    }
  });
};
