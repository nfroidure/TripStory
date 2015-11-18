'use strict';

var request = require('request');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var FacebookStrategy = require('passport-facebook');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var OAuth2Strategy = require('passport-oauth2');

module.exports = initAuthenticationController;

function initAuthenticationController(context) {

  // Serialization
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });
  passport.deserializeUser(function(id, done) {
    done(null, { _id: id });
  });

  // Local login
  passport.use('local', new LocalStrategy(localLoginLogic));
  passport.use('local-signup', new LocalStrategy({
    passReqToCallback: true,
  }, localSignupLogic));
  passport.use(new BasicStrategy(localLoginLogic));
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: context.base + '/auth/facebook/callback',
    enableProof: false,
    profileFields: ['id', 'displayName', 'photos', 'emails'],
  }, facebookLoginLogic));
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: context.base + '/auth/google/callback',
  }, googleLoginLogic));
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: context.base + '/auth/twitter/callback',
  }, twitterLoginLogic));
  passport.use('xee', new OAuth2Strategy({
    authorizationURL: 'https://cloud.xee.com/v1/auth/auth',
    tokenURL: 'https://cloud.xee.com/v1/auth/access_token.json',
    clientID: process.env.XEE_ID,
    clientSecret: process.env.XEE_SECRET,
    callbackURL: context.base + '/auth/xee/callback',
    useAuthorizationHeaderForGET: true,
  }, xeeLoginLogic));

  function localLoginLogic(username, password, done) {
    context.logger.debug('Authentication attempt:', username, password);
    context.db.collection('users').findOne({
      'contents.email': username,
    }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.password === password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      context.logger.info('Authenticated a user:', user._id, user.name);
      done(null, user);
    });
  }

  function localSignupLogic(req, username, password, done) {
    var upsertId = context.createObjectId();

    context.logger.debug('Sinup attempt:', req.body.username, upsertId);
    context.db.collection('users').findOne({
      'contents.email': username,
    }, function(err, user) {
      if (err) { return done(err); }
      if(user) { return done(new Error('E_EXISTS')); }
      if(!req.body.username) {
        return done(null, false, { message: 'Incorrect name.' });
      }
      context.logger.info('Registered a new user', username);
      context.db.collection('users').findOneAndUpdate({
        'contents.email': username,
      }, {
        $set: {
          contents: {
            name: req.body.username,
            email: username,
          },
        },
        $setOnInsert: {
          password: password,
          _id: upsertId,
          // Setting the PSA test car
          cars: [{
            _id: context.createObjectId(),
            type: 'psa',
            vin: process.env.PSA_VIN,
            contract: process.env.PSA_CONTRACT,
            code: process.env.PSA_CODE,
          }],
        },
      }, {
        upsert: true,
        returnOriginal: false,
      }, function(err2, result) {
        if (err2) { return done(err); }
        done(null, result.value);
      });
    });
  }

  function facebookLoginLogic(accessToken, refreshToken, profile, done) {
    var upsertId = context.createObjectId();

    context.logger.debug('Facebook auth info:', JSON.stringify(profile, null, 2), accessToken);

    context.db.collection('users').findOneAndUpdate({
      'auth.facebook.id': profile.id,
    }, {
      $set: {
        'contents.name': profile.displayName,
        'contents.email': profile.email,
        'contents.photo': profile.data ? profile.data.url : '',
        'auth.facebook': {
          id: profile.id,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      },
      $setOnInsert: {
        _id: upsertId,
      },
    }, {
      upsert: true,
      returnOriginal: false,
    }, function facebookLoginHandler(err, result) {
      if(!result.lastErrorObject.updatedExisting) {
        context.logger.info(
          '@nfroidure: Facebook signup:', profile.displayName,
          ' https://facebook.com/' + profile.id
        );
        context.bus.trigger({
          exchange: 'A_FB_SIGNUP',
          contents: {
            user_id: result.value._id,
          },
        });
      } else {
        context.bus.trigger({
          exchange: 'A_FB_LOGIN',
          contents: {
            user_id: result.value._id,
          },
        });
      }
      return done(err, result.value);
    });
  }

  function googleLoginLogic(accessToken, refreshToken, profile, done) {
    var upsertId = context.createObjectId();

    context.logger.debug('Google auth info:', JSON.stringify(profile, null, 2), accessToken);
    context.db.collection('users').findOneAndUpdate({
      $or: [{
        'auth.google.id': profile.id,
      }, {
        'contents.email': { $in: profile.emails.map(function(email) {
          return email.value;
        }) },
      }],
    }, {
      $set: {
        'contents.name': profile.displayName,
        'email.name': profile.emails[0].value,
        'contents.photo': profile.photos[0].value,
        'auth.google': {
          id: profile.id,
          accessToken: accessToken,
          refreshToken: refreshToken,
          emails: profile.emails,
        },
      },
      $setOnInsert: {
        _id: upsertId,
      },
    }, {
      upsert: true,
      returnOriginal: false,
    }, function googleLoginHandler(err, result) {
      if(!result.lastErrorObject.updatedExisting) {
        context.logger.info(
          '@nfroidure: Google signup:', profile.displayName
        );
        context.bus.trigger({
          exchange: 'A_GG_SIGNUP',
          contents: {
            user_id: result.value._id,
          },
        });
      } else {
        context.bus.trigger({
          exchange: 'A_GG_LOGIN',
          contents: {
            user_id: result.value._id,
          },
        });
      }
      return done(err, result.value);
    });
  }

  function twitterLoginLogic(accessToken, refreshToken, profile, done) {
    var upsertId = context.createObjectId();

    context.logger.debug('Twitter auth info:', JSON.stringify(profile, null, 2), accessToken);
    context.db.collection('users').findOneAndUpdate({
      'auth.twitter.id': profile.id,
    }, {
      $set: {
        'contents.name': profile.displayName,
        'contents.photo': profile.photos[0].value,
        'auth.twitter': {
          id: profile.id,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      },
      $setOnInsert: {
        _id: upsertId,
      },
    }, {
      upsert: true,
      returnOriginal: false,
    }, function twitterLoginHandler(err, result) {
      if(!result.lastErrorObject.updatedExisting) {
        context.logger.info(
          '@nfroidure: Twitter signup:', profile.displayName, '- @starring',
          profile.username
        );
        context.bus.trigger({
          exchange: 'A_TW_SIGNUP',
          contents: {
            user_id: result.value._id,
          },
        });
      } else {
        context.bus.trigger({
          exchange: 'A_TW_LOGIN',
          contents: {
            user_id: result.value._id,
          },
        });
      }
      return done(err, result.value);
    });
  }

  function xeeLoginLogic(accessToken, refreshToken, profile, done) {
    var upsertId = context.createObjectId();

    new Promise(function(resolve, reject) {
      request.get(
      'https://cloud.xee.com/v1/user/me.json?access_token=' + accessToken,
      function(err, httpRes, httpData) {
        if(err) {
          return reject(err);
        }
        resolve(JSON.parse(httpData));
      });
    }).then(function(profile) {
      context.logger.debug('Xee auth info:', JSON.stringify(profile, null, 2), accessToken);
      context.db.collection('users').findOneAndUpdate({
        'auth.xee.id': profile.id,
      }, {
        $set: {
          contents: {
            name: profile.firstName + ' ' + profile.name,
          },
          'auth.xee': {
            id: profile.id,
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
        },
        $setOnInsert: {
          _id: upsertId,
        },
      }, {
        upsert: true,
        returnOriginal: false,
      }, function xeeLoginHandler(err, result) {
        if(err) {
          return done(err);
        }
        if(!result.lastErrorObject.updatedExisting) {
          context.logger.info(
            '@nfroidure: Xee signup:', profile.firstName + ' ' + profile.name
          );
          context.bus.trigger({
            exchange: 'A_XEE_SIGNUP',
            contents: {
              user_id: result.value._id,
            },
          });
        } else {
          context.bus.trigger({
            exchange: 'A_XEE_LOGIN',
            contents: {
              user_id: result.value._id,
            },
          });
        }
        return done(err, result.value);
      });

    });
  }

  return passport;
}
