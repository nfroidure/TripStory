'use strict';

const request = require('request');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const FacebookStrategy = require('passport-facebook');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const OAuth2Strategy = require('passport-oauth2');
const YError = require('yerror');
const castToObjectId = require('mongodb').ObjectId;
const authenticationUtils = require('./authentication.utils');
const Promise = require('bluebird');
const YHTTPError = require('yhttperror');

module.exports = initAuthenticationController;

function initAuthenticationController(context) {

  // Serialization
  passport.serializeUser((user, done) => {
    context.logger.debug('Serialized user:', user._id.toString());
    done(null, user._id.toString());
  });
  passport.deserializeUser((id, done) => {
    context.logger.debug('Deserialized user:', id);
    Promise.resolve(context.db.collection('users').findOne({
      _id: castToObjectId(id),
    }))
    .then(done.bind(null, null))
    .catch(done);
  });

  // Local strategies
  passport.use('local', new LocalStrategy({
    passReqToCallback: true,
    usernameField: 'email',
    passwordField: 'password',
  }, localLoginLogic));
  passport.use('local-signup', new LocalStrategy({
    passReqToCallback: true,
    usernameField: 'email',
    passwordField: 'password',
  }, localSignupLogic));
  passport.use(new BasicStrategy({
    passReqToCallback: true,
  }, localLoginLogic));

  // OAuth strategies
  if(context.env.FACEBOOK_ID) {
    passport.use(new FacebookStrategy({
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
    passport.use(new GoogleStrategy({
      clientID: context.env.GOOGLE_ID,
      clientSecret: context.env.GOOGLE_SECRET,
      callbackURL: `${context.base}/auth/google/callback`,
      passReqToCallback: true,
    }, googleLoginLogic));
  } else {
    context.logger.error('No Google ID!');
  }
  if(context.env.TWITTER_ID) {
    passport.use(new TwitterStrategy({
      consumerKey: context.env.TWITTER_ID,
      consumerSecret: context.env.TWITTER_SECRET,
      callbackURL: `${context.base}/auth/twitter/callback`,
      passReqToCallback: true,
    }, twitterLoginLogic));
  } else {
    context.logger.error('No Twitter Consumer Key!');
  }
  if(context.env.XEE_ID) {
    passport.use('xee', new OAuth2Strategy({
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

  function localLoginLogic(req, email, password, done) {
    context.logger.debug('Authentication attempt:', email);
    context.db.collection('users').findOne({
      emailKeys: { $all: [authenticationUtils.normalizeEmail(email)] },
    }, (err, user) => {
      if(err) {
        return done(err);
      }
      if(!user) {
        return done(null, false, { message: 'E_BAD_EMAIL' }, 400);
      }

      authenticationUtils.comparePasswordToHash(password, user.passwordHash)
        .then(matched => {
          if(!matched) {
            return done(null, false, { message: 'E_BAD_PASSWORD' }, 400);
          }
          context.logger.info('Authenticated a user:', user._id, user.contents.name);
          done(null, user);
        }).catch(done);
    });
  }

  function localSignupLogic(req, email, password, done) {
    const upsertId = context.createObjectId();
    const name = req.body.name;

    context.logger.debug('Signup attempt:', email, name, upsertId);
    Promise.all([
      context.db.collection('users').findOne({
        emailKeys: { $all: [authenticationUtils.normalizeEmail(email)] },
      }),
      authenticationUtils.createPasswordHash(password),
    ]).spread((user, passwordHash) => {
      if(user) {
        throw new YHTTPError(400, 'E_USER_EXISTS', user._id);
      }
      if(!email) {
        return done(null, false, { message: 'E_BAD_EMAIL' }, 400);
      }
      if(!name) {
        return done(null, false, { message: 'E_BAD_NAME' }, 400);
      }
      context.logger.info('Registered a new user', email);
      return context.db.collection('users').findOneAndUpdate({
        emailKey: authenticationUtils.normalizeEmail(email),
      }, {
        $set: {
          contents: {
            name,
            email,
          },
          emailKeys: [authenticationUtils.normalizeEmail(email)],
        },
        $setOnInsert: {
          passwordHash,
          _id: upsertId,
          rights: authenticationUtils.createRights(),
        },
      }, {
        upsert: true,
        returnOriginal: false,
      }).then(result => {
        done(null, result.value);
      });
    }).catch(done);
  }

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
          return reject(err);
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

  return passport;
}
