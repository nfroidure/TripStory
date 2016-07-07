'use strict';

const emailJobs = {
  A_TRIP_CREATED: tripChannelJob,
  A_TRIP_UPDATED: tripChannelJob,
  A_TRIP_DELETED: tripChannelJob,
};

module.exports = emailJobs;

function tripChannelJob(context, event) {
  event.contents.users_ids.forEach(function broadcastEvent(userId) {
    context.pusher.trigger(
      'users-' + userId.toString(),
      event.exchange,
      event.contents
    );
  });
  context.pusher.trigger(
    'trips-' + event.contents.trip_id.toString(),
    event.exchange,
    event.contents
  );
  return Promise.resolve();
}
