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
  passport.use(new BasicStrategy(localLoginLogic));
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: 'http://' + context.host + ':' + context.port +
      '/auth/facebook/callback',
    enableProof: false,
  }, facebookLoginLogic));

  function localLoginLogic(username, password, done) {
    console.log('Authentication attempt:', username, password);
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
      console.log('Authenticated:', user);
      done(null, user);
    });
  }

  function facebookLoginLogic(accessToken, refreshToken, profile, done) {
    var upsertId = context.createObjectId();

console.log(JSON.stringify(profile, null, 2), accessToken)
    context.db.collection('users').findOneAndUpdate({
      'auth.facebook': {
        id: profile.id,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    }, {
      $set: {
        contents: {
          name: profile.displayName,
          email: profile.email,
        },
      },
      $setOnInsert: {
        _id: upsertId,
      },
    }, {
      upsert: true,
      returnOriginal: false,
    }, function facebookLoginHandler(err, result) {
      return done(err, result.value);
    });
  }

  return passport;
}
