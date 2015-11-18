'use strict';

var Twitter = require('twitter');
var workersUtils = require('../utils');

var SERVER = 'https://api.mtwitter.com/bgd/jdmc/1.0/';
var CONSUMER_KEY = 'EAJ3wyvzBNBSvW3Yq9UIX65ZX';
var CONSUMER_SECRET = 'UqTprTLqBVa5DgAHQEqL2yyZvouZcIqRvywR2WyfeLDIjfOcW5';
var ACCESS_TOKEN_KEY = '4181697333-ZfAMC9FZD9o56bXeNBGJGMo8T532U6UNEoGUKY9';
var ACCESS_TOKEN_SECRET = '8HVXHVZCDATQEXxlZtNOhNSSmUQtNHyn0uGljYvkFyIft';
var client = new Twitter({
  consumer_key: CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET,
  access_token_key: ACCESS_TOKEN_KEY,
  access_token_secret: ACCESS_TOKEN_SECRET,
});
var twitterJobs = {
  // A_TWITTER_SYNC: twitterSyncJob,
  A_TWITTER_SIGNUP: pairTwitterFriends,
  A_TWITTER_LOGIN: pairTwitterFriends,
};

// Doc: https://dev.twitter.com/rest/reference/get/search/tweets

module.exports = twitterJobs;

function twitterSyncJob(context, event) {
  return workersUtils.getCurrentTrips(context)
  .then(function handleTwitterUsers(tripsEvents) {
    return Promise.all(tripsEvents.map(function(tripEvent) {
      return new Promise(function(resolve, reject) {
        client.get(
          'search/tweets', {
            q: '#' + tripEvent.trip.hash,
            lang: 'fr',
          },
          function twitterSearchHandler(err, tweets, response) {
            if(err) {
              reject(err);
            }
            //context.logger.debug(JSON.stringify(tweets, null, 2));
            resolve(Promise.all(tweets.statuses.map(function(status) {
              return context.db.collection('users').findOne({
                'auth.twitter.id': status.user.id + '',
              }).then(function(author) {
                if(!author) {
                  context.logger.debug('No user found for ', status.user._id)
                  return;
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
                    'contents.created_at': status.created_at,
                  },
                  $setOnInsert: {
                    'contents.date': new Date(status.created_at),
                    'contents.trip_id': tripEvent._id,
                    'contents.type': 'twitter-status',
                    trip: tripEvent.trip,
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
    return new Promise(function(resolve, reject) {
      client.get(
        'friends/ids',
        {},
        function twitterSearchHandler(err, tweets, response) {
          if(err) {
            reject(err);
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
  });
}
