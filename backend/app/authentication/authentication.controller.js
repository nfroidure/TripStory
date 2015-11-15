'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var FacebookStrategy = require('passport-facebook');

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
    callbackURL: 'http://' + context.host + ':' + context.port +
      '/auth/facebook/callback',
    enableProof: false,
  }, facebookLoginLogic));

  function localLoginLogic(username, password, done) {
    context.logger.debug('Authentication attempt:', username, password);
    context.db.collection('users').findOne({
      'contents.email': username,
    }, function (err, user) {
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

    context.logger.debug('Sinup attempt:', req.body.name, upsertId);
    context.db.collection('users').findOne({
      'contents.email': username,
    }, function (err, user) {
      if (err) { return done(err); }
      if(user) { return done(new Error('E_EXISTS')); }
      if(!req.body.name) {
        return done(null, false, { message: 'Incorrect name.' });
      }
      context.logger.info('Registered a new user', username);
      context.db.collection('users').findOneAndUpdate({
        'contents.email': username,
      }, {
        $set: {
          contents: {
            name: req.body.name,
            email: username,
          },
        },
        $setOnInsert: {
          password: password,
          _id: upsertId,
        },
      }, {
        upsert: true,
        returnOriginal: false,
      }, function (err, result) {
        if (err) { return done(err); }
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
        contents: {
          name: profile.displayName,
          email: profile.email,
        },
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
      context.logger.debug('Facebook upsert result', JSON.stringify(result));
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

  return passport;
}
