'use strict';

var emailJobs = {
  A_TRIP_CREATED: tripChannelJob,
  A_TRIP_UPDATED: tripChannelJob,
  A_TRIP_DELETED: tripChannelJob,
};

module.exports = emailJobs;

function tripChannelJob(context, event) {
  context.pusher.trigger(
    'trips',
    event.exchange,
    event.contents
  );
  context.pusher.trigger(
    'trips-' + event.contents.trip_id.toString(),
    event.exchange,
    event.contents
  );
  return Promise.resolve();
}
