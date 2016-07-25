'use strict';

const request = require('request');
const FacebookStrategy = require('passport-facebook');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const OAuth2Strategy = require('passport-oauth2');
const YError = require('yerror');
const castToObjectId = require('mongodb').ObjectId;
const authenticationUtils = require('./authentication.utils');
const Promise = require('bluebird');

module.exports = initOAuthStrategies;

function initOAuthStrategies(context) {
  // OAuth strategies
  if(context.env.FACEBOOK_ID) {
    context.passport.use(new FacebookStrategy({
      clientID: context.env.FACEBOOK_ID,
      clientSecret: context.env.FACEBOOK_SECRET,
      callbackURL: `${context.base}/auth/facebook/callback`,
      enableProof: false,
      profileFields: ['id', 'displayName', 'photos', 'emails'],
      passReqToCallback: true,
    }, facebookLoginLogic));
  } else {
    context.logger.error('No Facebook ID!');
  }
  if(context.env.GOOGLE_ID) {
    context.passport.use(new GoogleStrategy({
      clientID: context.env.GOOGLE_ID,
      clientSecret: context.env.GOOGLE_SECRET,
      callbackURL: `${context.base}/auth/google/callback`,
      passReqToCallback: true,
    }, googleLoginLogic));
  } else {
    context.logger.error('No Google ID!');
  }
  if(context.env.TWITTER_ID) {
    context.passport.use(new TwitterStrategy({
      consumerKey: context.env.TWITTER_ID,
      consumerSecret: context.env.TWITTER_SECRET,
      callbackURL: `${context.base}/auth/twitter/callback`,
      passReqToCallback: true,
    }, twitterLoginLogic));
  } else {
    context.logger.error('No Twitter Consumer Key!');
  }
  if(context.env.XEE_ID) {
    context.passport.use('xee', new OAuth2Strategy({
      authorizationURL: 'https://cloud.xee.com/v1/auth/auth',
      tokenURL: 'https://cloud.xee.com/v1/auth/access_token.json',
      clientID: context.env.XEE_ID,
      clientSecret: context.env.XEE_SECRET,
      callbackURL: `${context.base}/auth/xee/callback`,
      useAuthorizationHeaderForGET: true,
      useAuthorizationHeaderForPOST: true,
      passReqToCallback: true,
    }, xeeLoginLogic));
  } else {
    context.logger.error('No Xee ID!');
  }

  // Logic
  function facebookLoginLogic(req, accessToken, refreshToken, profile, done) { // eslint-disable-line
    const upsertId = context.createObjectId();
    const findQuery = {};
    let updateQuery;

    context.logger.debug('Facebook auth info:', JSON.stringify(profile, null, 2), accessToken);

    if(!req._authState.contents) {
      return done(new YError('E_NO_STATE'));
    }

    updateQuery = {
      $set: {
        'contents.name': profile.displayName,
        'contents.email': profile.emails[0].value,
        avatar_url: profile.photos[0].value,
        'auth.facebook': {
          id: profile.id,
          accessToken,
          refreshToken,
        },
      },
      $addToSet: {
        emailKeys: {
          $each: profile.emails.map(email => authenticationUtils.normalizeEmail(email.value)),
        },
      },
    };

    if(req._authState.contents.user_id) {
      findQuery._id = castToObjectId(req._authState.contents.user_id);
    } else {
      findQuery.$or = [{
        'auth.facebook.id': profile.id,
      }, {
        'contents.email': { $in: profile.emails.map(email => email.value) },
      }];
      // It looks like Mongo can't recognize when an upsert is beeing processed...
      // So we avoid setting the upsert id ourself when we are sure the user exists.
      // MongoError: exception: After applying the update to the document
      // {_id: "xxx" , ...}, the (immutable) field '_id' was found to have
      // been altered to _id: ObjectId('yyy')
      updateQuery.$setOnInsert = {
        _id: upsertId,
        rights: authenticationUtils.createRights(),
        friends_ids: [],
        cars: [],
      };
    }

    context.db.collection('users').findOneAndUpdate(findQuery, updateQuery, {
      upsert: true,
      returnOriginal: false,
    }, (err, result) => {
      if(err) {
        return done(err);
      }
      if(!result.lastErrorObject.updatedExisting) {
        context.logger.info(
          'Facebook signup:', profile.displayName,
          ` https://facebook.com/${profile.id}`
        );
        context.bus.trigger({
          exchange: 'A_FB_SIGNUP',
          contents: {
            user_id: result.value._id,
            ip: req.ip,
          },
        });
      } else {
        context.bus.trigger({
          exchange: 'A_FB_LOGIN',
          contents: {
            user_id: result.value._id,
            ip: req.ip,
          },
        });
      }
      return done(err, result.value);
    });
  }

  function googleLoginLogic(req, accessToken, refreshToken, profile, done) { // eslint-disable-line
    const upsertId = context.createObjectId();
    const findQuery = {};
    let updateQuery;

    context.logger.debug('Google auth info:', JSON.stringify(profile, null, 2), accessToken);

    if(!req._authState.contents) {
      return done(new YError('E_NO_STATE'));
    }

    updateQuery = {
      $set: {
        'contents.name': profile.displayName,
        'contents.email': profile.emails[0].value,
        avatar_url: profile.photos[0].value,
        'auth.google': {
          id: profile.id,
          accessToken,
          refreshToken,
          emails: profile.emails,
        },
      },
      $addToSet: {
        emailKeys: {
          $each: profile.emails.map(email => authenticationUtils.normalizeEmail(email.value)),
        },
      },
    };

    if(req._authState.contents.user_id) {
      findQuery._id = castToObjectId(req._authState.contents.user_id);
    } else {
      findQuery.$or = [{
        'auth.google.id': profile.id,
      }, {
        'contents.email': { $in: profile.emails.map(email => email.value) },
      }];
      // It looks like Mongo can't recognize when an upsert is beeing processed...
      // So we avoid setting the upsert id ourself when we are sure the user exists.
      // MongoError: exception: After applying the update to the document
      // {_id: "xxx" , ...}, the (immutable) field '_id' was found to have
      // been altered to _id: ObjectId('yyy')
      updateQuery.$setOnInsert = {
        _id: upsertId,
        rights: authenticationUtils.createRights(),
        friends_ids: [],
        cars: [],
      };
    }

    context.db.collection('users').findOneAndUpdate(findQuery, updateQuery, {
      upsert: true,
      returnOriginal: false,
    }, (err, result) => {
      if(err) {
        return done(err);
      }
      if(!result.lastErrorObject.updatedExisting) {
        context.logger.info(
          'Google signup:', profile.displayName
        );
        context.bus.trigger({
          exchange: 'A_GG_SIGNUP',
          contents: {
            user_id: result.value._id,
            ip: req.ip,
          },
        });
      } else {
        context.bus.trigger({
          exchange: 'A_GG_LOGIN',
          contents: {
            user_id: result.value._id,
            ip: req.ip,
          },
        });
      }
      return done(err, result.value);
    });
  }

  function twitterLoginLogic(req, accessToken, refreshToken, profile, done) { // eslint-disable-line
    const upsertId = context.createObjectId();
    const findQuery = {};
    let updateQuery;

    context.logger.debug('Twitter auth info:', JSON.stringify(profile, null, 2), accessToken);

    if(!req._authState.contents) {
      return done(new YError('E_NO_STATE'));
    }

    updateQuery = {
      $set: {
        'contents.name': profile.displayName,
        avatar_url: profile.photos[0].value,
        'auth.twitter': {
          id: profile.id,
          accessToken,
          refreshToken,
        },
      },
    };

    if(req._authState.contents.user_id) {
      findQuery._id = castToObjectId(req._authState.contents.user_id);
    } else {
      findQuery['auth.twitter.id'] = profile.id;
      // It looks like Mongo can't recognize when an upsert is beeing processed...
      // So we avoid setting the upsert id ourself when we are sure the user exists.
      // MongoError: exception: After applying the update to the document
      // {_id: "xxx" , ...}, the (immutable) field '_id' was found to have
      // been altered to _id: ObjectId('yyy')
      updateQuery.$setOnInsert = {
        _id: upsertId,
        rights: authenticationUtils.createRights(),
        friends_ids: [],
        cars: [],
      };
    }

    context.db.collection('users').findOneAndUpdate(findQuery, updateQuery, {
      upsert: true,
      returnOriginal: false,
    }, (err, result) => {
      if(err) {
        return done(err);
      }
      if(!result.lastErrorObject.updatedExisting) {
        context.logger.info(
          'Twitter signup:', profile.displayName, '- @starring',
          profile.username
        );
        context.bus.trigger({
          exchange: 'A_TWITTER_SIGNUP',
          contents: {
            user_id: result.value._id,
            ip: req.ip,
          },
        });
      } else {
        context.bus.trigger({
          exchange: 'A_TWITTER_LOGIN',
          contents: {
            user_id: result.value._id,
            ip: req.ip,
          },
        });
      }
      return done(err, result.value);
    });
  }

  function xeeLoginLogic(req, accessToken, refreshToken, profile, done) { // eslint-disable-line
    const upsertId = context.createObjectId();

    if(!req._authState.contents) {
      return done(new YError('E_NO_STATE'));
    }

    new Promise((resolve, reject) => {
      request.get(
      `https://cloud.xee.com/v1/user/me.json?access_token=${accessToken}`,
      (err, httpRes, httpData) => {
        if(err) {
          reject(err);
          return;
        }
        resolve(JSON.parse(httpData));
      });
    }).then(profile => {
      const findQuery = {};
      let updateQuery;

      context.logger.debug('Xee auth info:', JSON.stringify(profile, null, 2), accessToken);

      updateQuery = {
        $set: {
          'contents.name': `${profile.firstName} ${profile.name}`,
          'auth.xee': {
            id: profile.id,
            accessToken,
            refreshToken,
          },
        },
      };

      if(req._authState.contents.user_id) {
        findQuery._id = castToObjectId(req._authState.contents.user_id);
      } else {
        findQuery['auth.xee.id'] = profile.id;
        // It looks like Mongo can't recognize when an upsert is beeing processed...
        // So we avoid setting the upsert id ourself when we are sure the user exists.
        // MongoError: exception: After applying the update to the document
        // {_id: "xxx" , ...}, the (immutable) field '_id' was found to have
        // been altered to _id: ObjectId('yyy')
        updateQuery.$setOnInsert = {
          _id: upsertId,
          rights: authenticationUtils.createRights(),
          friends_ids: [],
          cars: [],
        };
      }

      context.db.collection('users').findOneAndUpdate(findQuery, updateQuery, {
        upsert: true,
        returnOriginal: false,
      }, (err, result) => {
        if(err) {
          return done(err);
        }
        if(!result.lastErrorObject.updatedExisting) {
          context.logger.info(
            'Xee signup:', `${profile.firstName} ${profile.name}`
          );
          context.bus.trigger({
            exchange: 'A_XEE_SIGNUP',
            contents: {
              user_id: result.value._id,
              ip: req.ip,
            },
          });
        } else {
          context.bus.trigger({
            exchange: 'A_XEE_LOGIN',
            contents: {
              user_id: result.value._id,
              ip: req.ip,
            },
          });
        }
        return done(err, result.value);
      });

    });
  }
}
