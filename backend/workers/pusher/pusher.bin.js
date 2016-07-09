'use strict';

const jobs = require('./pusher.jobs.js');

// One day, i'll be a real process!!! Let just be a lib now :)
module.exports = function initPusherWorker(context) {
  context.bus.consume(function pusherConsumer(event) {
    if(jobs[event.exchange]) {
      context.logger.debug('New Pusher Event', event);
      jobs[event.exchange](context, event)
      .then(function pusherError() {
        context.logger.debug('Successfully processed event', event);
      })
      .catch(function pusherSuccess(err) {
        context.logger.error('Error while processing event', event, err);
      });
    }
  });
};
