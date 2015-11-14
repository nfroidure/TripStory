'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;

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

  return passport;
}
