'use strict';

var workersUtils = require('../utils');
var controllersUtils = require('../../app/utils/controllers');
var request = require('request');
var YError = require('yerror');
var SINCE_ID_STORE_PREFIX = 'facebook:since:';
var SERVER = 'https://graph.facebook.com/v2.5';
var facebookJobs = {
  A_FB_SYNC: facebookSyncJob,
  A_FB_SIGNUP: facebookSignupJob,
  A_FB_LOGIN: facebookLoginJob,
};

module.exports = facebookJobs;

function facebookSignupJob(context, event) {
  return context.db.collection('users').findOne({
    _id: event.contents.user_id,
  })
  .then(pairFacebookFriends.bind(null, context));
}

function facebookLoginJob(context, event) {
  return context.db.collection('users').findOne({
    _id: event.contents.user_id,
  })
  .then(pairFacebookFriends.bind(null, context));
}

// https://developers.facebook.com/docs/graph-api/reference/v2.5/user/friends
function pairFacebookFriends(context, user) {
  return new Promise(function pairFriendsPromise(resolve, reject) {
    request.get(
      SERVER + '/me/friends?access_token=' +
      user.auth.facebook.accessToken,
      function pairFriendsCallback(err, res, body) {
        if(err) {
          return reject(err);
        }
        if(200 > res.statusCode || 300 <= res.statusCode) {
          return reject(new Error('E_BAD_RESPONSE'));
        }
        context.logger.debug('Retrieved facebook friends:', res.statusCode, body);
        // Update friends that are know in the platform
        return context.db.collection('users').find({
          'auth.facebook.id': { $in: JSON.parse(body).data.map(function(friend) {
            return friend.id;
          }) },
        }, {
          _id: '',
        }).toArray().then(function(friends) {
          var friendsIds = friends.map(function(friend) {
            return friend._id;
          });

          if(!friendsIds.length) {
            return Promise.resolve();
          }

          return Promise.all([
            context.db.collection('users').updateMany({
              _id: { $in: friendsIds },
            }, {
              $addToSet: {
                friends_ids: user._id,
              },
            }),
            context.db.collection('users').updateOne({
              _id: user._id,
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

// https://developers.facebook.com/docs/graph-api/reference/v2.5/user/feed
function facebookSyncJob(context) {
  return workersUtils.getCurrentTrips(context)
  .then(function handleCurrentTrips(tripsEvents) {
    if(!tripsEvents.length) {
      return Promise.resolve();
    }
    return Promise.all(tripsEvents.map(function(tripEvent) {
      context.logger.debug('Retrieving trip facebook users for:', tripEvent.trip.title);
      return context.db.collection('users').find({
        _id: { $in: tripEvent.trip.friends_ids.concat(tripEvent.owner_id) },
        'auth.facebook': { $exists: true },
      }).toArray()
      .then(function(users) {
        context.logger.debug('Found ' + users.length + ' facebook users for:', tripEvent.trip.title);
        return Promise.all(users.map(function(user) {
          var newSince;

          context.logger.debug('Getting ' + user.contents.name + ' statuses.');
          return context.store.get(
            SINCE_ID_STORE_PREFIX + tripEvent._id.toString() + ':' +
            user._id.toString()
          )
          .then(function(since) {
            since = since || Math.floor(
              (tripEvent.created.seal_date).getTime() / 1000
            );
            return new Promise(function pairFriendsPromise(resolve, reject) {
              request.get(
                SERVER + '/me/posts' +
                '?access_token=' + user.auth.facebook.accessToken +
                '&fields=description,caption,link,created_time,id,photos,' +
                'application,from,icon,message,message_tags,name,picture,place,' +
                'status_type,type' +
                '&since=' + since,
                function retrieveStatusCallback(err, res, body) {
                  var statuses;

                  if(err) {
                    return reject(err);
                  }
                  if(200 > res.statusCode || 300 <= res.statusCode) {
                    context.logger.debug(
                      'Facebook statuses retrieval failed:', res.statusCode, body
                    );
                    return resolve();
                  }
                  try {
                    statuses = JSON.parse(body).data || [];
                  } catch (err) {
                    return reject(err);
                  }
                  context.logger.debug('Retrieved facebook statuses:', res.statusCode, body);
                  context.logger.debug(
                    'Fetched ' + statuses.length +
                    ' statuses sent by ' + user.contents.name + ' since ' +
                    (new Date(since * 1000)).toISOString()
                  );
                  if(!statuses.length) {
                    return resolve();
                  }
                  newSince = Math.round(
                    (new Date(statuses[0].created_time)).getTime() / 1000
                  );
                  statuses = statuses.filter(function(status) {
                    return status.message &&
                      -1 !== ['photo', 'status', 'link'].indexOf(status.type);
                  });
                  Promise.all(statuses.map(function(status) {
                    var statusDate = new Date(status.created_time);

                    if(tripEvent.created.seal_date.getTime() > statusDate.getTime()) {
                      return Promise.resolve();
                    }
                    return context.db.collection('events').findOneAndUpdate({
                      'contents.facebookId': status.id,
                    }, {
                      $set: {
                        'contents.facebookId': status.id,
                        'contents.text': status.message,
                        'contents.geo': status.place && status.place.location &&
                          'undefined' === typeof status.place.location.latitude &&
                          'undefined' === typeof status.place.location.longitude ? [
                            status.place.location.latitude,
                            status.place.location.longitude,
                            0,
                          ] : [],
                        'contents.user_name': status.from.name,
                      },
                      $setOnInsert: {
                        _id: context.createObjectId(),
                        owner_id: user._id,
                        'contents.trip_id': tripEvent._id,
                        'contents.type': 'facebook-' + status.type,
                        trip: tripEvent.trip,
                        created: controllersUtils.getDateSeal(statusDate),
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
                  }))
                  .then(context.store.set.bind(
                    null,
                    SINCE_ID_STORE_PREFIX + tripEvent._id.toString() + ':' +
                    user._id.toString(),
                    newSince
                  ))
                  .then(resolve)
                  .catch(reject);
                }
              );
            });
          });
        }));
      });
    }));
  });
}
