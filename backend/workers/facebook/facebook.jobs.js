'use strict';

var request = require('request');

var SERVER = 'https://graph.facebook.com/';
var facebookJobs = {
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

function pairFacebookFriends(context, user) {
  return new Promise(function pairFriendsPromise(resolve, reject) {
    request.get(
      SERVER + user.auth.facebook.id + '/friends?access_token=' +
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
