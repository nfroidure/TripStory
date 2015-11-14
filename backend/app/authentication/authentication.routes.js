'use strict';

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var initAuthenticationController = require('./authentication.controller');

module.exports = initAuthenticationRoutes;

function initAuthenticationRoutes(context) {
  var passport = initAuthenticationController(context);

  context.app.use(session({
    secret: 'onattendpaspatrick',
    store: new MongoStore({ db: context.db }),
  }));
  context.app.use(passport.initialize());
  context.app.use(passport.session());

  context.app.post('/api/v0/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.sendStatus(201);
      }
      req.logIn(user, function(err) {
        if (err) {
          return next(err);
        }
        //return res.redirect('/users/' + user.username);
        res.sendStatus(200);
      });
    })(req, res, next);
  });
}
