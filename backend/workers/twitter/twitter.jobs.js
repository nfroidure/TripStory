'use strict';

var workersUtils = require('../utils');
var controllersUtils = require('../../app/utils/controllers');

var twitterJobs = {
  A_TWITTER_SYNC: twitterSyncJob,
  A_TWITTER_SIGNUP: pairTwitterFriends,
  A_TWITTER_LOGIN: pairTwitterFriends,
};

// Doc: https://dev.twitter.com/rest/reference/get/search/tweets

module.exports = twitterJobs;

function twitterSyncJob(context) {
  return workersUtils.getCurrentTrips(context)
  .then(function handleTwitterUsers(tripsEvents) {
    return Promise.all(tripsEvents.map(function(tripEvent) {
      return new Promise(function(resolve, reject) {
        context.twitter.get(
          'search/tweets', {
            q: '#' + tripEvent.trip.hash,
            lang: 'fr',
          },
          function twitterSearchHandler(err, tweets) {
            if(err) {
              return reject(err);
            }
            context.logger.debug(JSON.stringify(tweets, null, 2));
            resolve(Promise.all(tweets.statuses.map(function(status) {
              return context.db.collection('users').findOne({
                'auth.twitter.id': status.user.id + '',
              }).then(function(author) {
                if(!author) {
                  context.logger.debug('No user found for ', status.user._id);
                  return Promise.resolve();
                }
                return context.db.collection('events').findOneAndUpdate({
                  'twitter.id': status.id,
                }, {
                  $set: {
                    twitter: {
                      id: status.id,
                      text: status.text,
                      geo: status.geo,
                    },
                    'contents.text': status.text,
                    'contents.geo': status.geo,
                    'contents.profile_image': status.profile_image_url_https,
                    'contents.entities': status.entities,
                    'contents.user_name': status.user.name,
                  },
                  $setOnInsert: {
                    owner_id: author._id,
                    'contents.trip_id': tripEvent._id,
                    'contents.type': 'twitter-status',
                    trip: tripEvent.trip,
                    created: controllersUtils.getDateSeal(status.created_at),
                  },
                }, {
                  upsert: true,
                  returnOriginal: false,
                });
              });
            })));
          }
        );
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
