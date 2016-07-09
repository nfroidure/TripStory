'use strict';

const workersUtils = require('../utils');
const controllersUtils = require('../../app/utils/controllers');
const Twitter = require('twitter');
const SINCE_ID_STORE_PREFIX = 'twitter:since_id:';

const twitterJobs = {
  A_TWITTER_SYNC: twitterSyncJob,
  A_TWITTER_SIGNUP: pairTwitterFriends,
  A_TWITTER_LOGIN: pairTwitterFriends,
};

// Doc: https://dev.twitter.com/rest/reference/get/search/tweets

module.exports = twitterJobs;

function twitterSyncJob(context) {
  return workersUtils.getCurrentTrips(context)
  .then(function handleCurrentTrips(tripsEvents) {
    if(!tripsEvents.length) {
      return Promise.resolve();
    }
    return Promise.all(tripsEvents.map(tripEvent => {
      context.logger.debug('Retrieving trip twitter users for:', tripEvent.trip.title);
      return context.db.collection('users').find({
        _id: { $in: tripEvent.trip.friends_ids.concat(tripEvent.owner_id) },
        'auth.twitter': { $exists: true },
      }).toArray()
      .then((users) => {
        context.logger.debug(`Found ${users.length} twitter users for:`, tripEvent.trip.title);
        return Promise.all(users.map((user) => {
          var newSinceId;
          var twitter = new Twitter({
            consumer_key: process.env.TWITTER_ID,
            consumer_secret: process.env.TWITTER_SECRET,
            access_token_key: user.auth.twitter.accessToken,
            access_token_secret: user.auth.twitter.refreshToken,
          });

          context.logger.debug(`Getting ${user.contents.name} twitts`);
          return context.store.get(
            `${SINCE_ID_STORE_PREFIX}${tripEvent._id.toString()}:${user._id.toString()}`
          )
          .then(function(sinceId) {
            return new Promise((resolve, reject) => {
              twitter.get(
                'statuses/user_timeline', {
                  user_id: user.auth.twitter.id,
                  include_rts: false,
                  since_id: sinceId,
                },
                function twitterSearchHandler(err, statuses) {
                  if(err) {
                    return reject(err);
                  }
                  context.logger.debug('Fetched ' + statuses.length +
                    ' twitts sent by ' + user.contents.name, sinceId);
                  if(!statuses.length) {
                    return resolve();
                  }
                  newSinceId = statuses[0].id;
                  Promise.all(statuses.map(function(status) {
                    var tweetDate = new Date(status.created_at);
                    var updateQuery;

                    if(tripEvent.created.seal_date.getTime() > tweetDate.getTime()) {
                      return Promise.resolve();
                    }
                    updateQuery = {
                      $set: {
                        'contents.twitterId': status.id,
                        'contents.text': status.text,
                        'contents.geo': status.geo && 'point' === status.geo.type ?
                          status.geo.coordinates :
                          [],
                        'contents.author_id': user._id,
                      },
                      $setOnInsert: {
                        _id: context.createObjectId(),
                        owner_id: user._id,
                        'contents.trip_id': tripEvent._id,
                        'contents.type': 'twitter-status',
                        trip: tripEvent.trip,
                        created: controllersUtils.getDateSeal(tweetDate.getTime()),
                      },
                    };
                    if(status.entities.media && status.entities.media.length) {
                      updateQuery.$set['contents.media'] = status.entities.media
                      .map(function(media) {
                        return {
                          type: 'photo' === media.type ?
                            'image' :
                            'other',
                          src_url: media.media_url_https,
                          link_url: media.expanded_url,
                        };
                      });
                    }
                    return context.db.collection('events').findOneAndUpdate({
                      'contents.twitterId': status.id,
                    }, updateQuery, {
                      upsert: true,
                      returnOriginal: false,
                    })
                    .then((result) => {
                      context.bus.trigger({
                        exchange: 'A_TRIP_UPDATED',
                        contents: {
                          trip_id: tripEvent._id,
                          event_id: result.value._id,
                          users_ids: tripEvent.trip.friends_ids.concat([tripEvent.owner_id]),
                        },
                      });
                    });
                  }))
                  .then(context.store.set.bind(
                      null,
                      `${SINCE_ID_STORE_PREFIX}${tripEvent._id.toString()}:${user._id.toString()}`,
                      newSinceId
                    ))
                  .then(resolve)
                  .catch(reject);
                });
            });
          });
        }));
      });
    }));
  });
}

function pairTwitterFriends(context, event) {
  return context.db.collection('users').findOne({
    _id: event.contents.user_id,
  }).then(user => {
    const twitter = new Twitter({
      consumer_key: process.env.TWITTER_ID,
      consumer_secret: process.env.TWITTER_SECRET,
      access_token_key: user.auth.twitter.accessToken,
      access_token_secret: user.auth.twitter.refreshToken,
    });

    return new Promise(function pairFriendsPromise(resolve, reject) {
      twitter.get(
        'friends/ids',
        {},
        function twitterSearchHandler(err, data) {
          if(err) {
            return reject(err);
          }

          context.logger.debug('Retrieved twitter friends', data);
          context.db.collection('users').find({
            'auth.twitter.id': { $in: (data.ids || [])
                .map(id => `${id}`) },
          }, { _id: '' }).toArray()
          .then(friends => {
            const friendsIds = friends.map(friend => friend._id);

            if(!friendsIds.length) {
              return Promise.resolve();
            }

            return Promise.all([
              context.db.collection('users').updateMany({
                _id: { $in: friendsIds },
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
  });
}
