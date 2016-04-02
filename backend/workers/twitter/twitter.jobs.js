'use strict';

var workersUtils = require('../utils');
var controllersUtils = require('../../app/utils/controllers');
var SINCE_ID_STORE_PREFIX = 'twitter:since_id:';

var twitterJobs = {
  A_TWITTER_SYNC: twitterSyncJob,
  A_TWITTER_SIGNUP: pairTwitterFriends,
  A_TWITTER_LOGIN: pairTwitterFriends,
};

// Doc: https://dev.twitter.com/rest/reference/get/search/tweets

module.exports = twitterJobs;

function twitterSyncJob(context) {
  return workersUtils.getCurrentTrips(context)
  .then(function handleCurrentTrips(tripsEvents) {
    if(!tripsEvents) {
      return Promise.resolve();
    }
    return Promise.all(tripsEvents.map(function(tripEvent) {
      return context.store.get(SINCE_ID_STORE_PREFIX + tripEvent._id.toString())
      .then(function(sinceId) {
        var newSinceId;

        return new Promise(function(resolve, reject) {
          context.twitter.get(
            'search/tweets', {
              q: '#' + tripEvent.trip.hash,
              lang: 'fr',
              since_id: sinceId,
            },
            function twitterSearchHandler(err, tweets) {
              if(err) {
                return reject(err);
              }
              if(!tweets.statuses.length) {
                return Promise.resolve();
              }
              context.logger.debug(JSON.stringify(tweets, null, 2));
              newSinceId = tweets.statuses[0].id;
              Promise.all(tweets.statuses.map(function(status) {
                return context.db.collection('users').findOne({
                  'auth.twitter.id': status.user.id + '',
                }).then(function(author) {
                  if(!author) {
                    context.logger.debug('No user found for ', status.user._id);
                    return Promise.resolve();
                  }
                  return context.db.collection('events').findOneAndUpdate({
                    'contents.twitterId': status.id,
                  }, {
                    $set: {
                      'contents.twitterId': status.id,
                      'contents.text': status.text,
                      'contents.geo': status.geo || [],
                      'contents.profile_image': status.profile_image_url_https || '',
                      'contents.user_name': status.user.name,
                    },
                    $setOnInsert: {
                      _id: context.createObjectId(),
                      owner_id: author._id,
                      'contents.trip_id': tripEvent._id,
                      'contents.type': 'twitter-status',
                      trip: tripEvent.trip,
                      created: controllersUtils.getDateSeal(status.created_at),
                    },
                  }, {
                    upsert: true,
                    returnOriginal: false,
                  })
                  .then(function(result) {
                    context.bus.trigger({
                      exchange: 'A_TRIP_UPDATED',
                      contents: {
                        trip_id: tripEvent._id,
                        event_id: result.value._id,
                        users_ids: tripEvent.trip.friends_ids.concat([tripEvent.owner_id]),
                      },
                    });
                  });
                });
              }))
              .then(context.store.set.bind(
                  null,
                  SINCE_ID_STORE_PREFIX + tripEvent._id.toString(),
                  newSinceId
                ))
              .then(resolve)
              .catch(reject);
            }
          );
        });
      });
    }));
  });
}

function pairTwitterFriends(context, event) {
  return new Promise(function pairFriendsPromise(resolve, reject) {
    context.twitter.get(
      'friends/ids',
      {},
      function twitterSearchHandler(err, data) {
        if(err) {
          return reject(err);
        }

        context.logger.debug('Retrieved twitter friends', data);
        context.db.collection('users').find({
          'auth.twitter.id': { $in: (data.ids || [])
              .map(function(id) { return id + ''; }) },
        }, { _id: '' }).toArray()
        .then(function(friends) {
          var friendsIds = friends.map(function(friend) { return friend._id; });

          if(!friendsIds.length) {
            return Promise.resolve();
          }

          return Promise.all([
            context.db.collection('users').updateMany({
              _id: friendsIds,
            }, {
              $addToSet: {
                friends_ids: event.contents.user_id,
              },
            }),
            context.db.collection('users').updateOne({
              _id: event.contents.user_id,
            }, {
              $addToSet: {
                friends_ids: { $each: friendsIds },
              },
            }),
          ]);
        })
        .then(resolve)
        .catch(reject);
      }
    );
  });
}
