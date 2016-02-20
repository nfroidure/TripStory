'use strict';

var Twitter = require('twitter');
var workersUtils = require('../utils');
var controllersUtils = require('../../app/utils/controllers');

var CONSUMER_KEY = process.env.TWITTER_ID;
var CONSUMER_SECRET = process.env.TWITTER_SECRET;
var ACCESS_TOKEN_KEY = process.env.TWITTER_ACCESS_TOKEN_KEY;
var ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;
var client = new Twitter({
  consumer_key: CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET,
  access_token_key: ACCESS_TOKEN_KEY,
  access_token_secret: ACCESS_TOKEN_SECRET,
});
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
        client.get(
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

function pairTwitterFriends(context, user) {
  return new Promise(function pairFriendsPromise(resolve, reject) {
    client.get(
      'friends/ids',
      {},
      function twitterSearchHandler(err, tweets) {
        if(err) {
          return reject(err);
        }

        context.logger.debug('Retrieved twitter friends', tweets);

        Promise.all((tweets.ids || []).map(function syncFriendUsers(id) {
          // Update friends that are know in the platform
          return context.db.collection('users').findOneAndUpdate({
            'auth.twitter.id': id,
          }, {
            $addToSet: {
              friends_ids: user._id,
            },
          }).then(function(result) {
            return result.value._id;
          });
        })).then(function syncUserFriends(friendsIds) {
          friendsIds = friendsIds.filter(function(a) { return a; });

          if(friendsIds.length) {
            return context.db.collection('users').updateOne({
              _id: user._id,
            }, {
              $addToSet: {
                friends_ids: { $each: friendsIds },
              },
            });
          }
        }).then(resolve).catch(reject);
      }
    );
  });
}
