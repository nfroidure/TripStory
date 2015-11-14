'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

module.exports = initAuthenticationController;

function initAuthenticationController(context) {

  // Local login
  passport.use(new LocalStrategy(
    function(username, password, done) {
      console.log('sfsdfsdfdsf'); 
      context.db.collection('users').findOne({
        'contents.email': username,
      }, function (err, user) {
        console.log(username, password, user)
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.password === password) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      });
    }
  ));

  return passport;
}
