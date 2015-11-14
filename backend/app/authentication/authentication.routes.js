'use strict';

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var initAuthenticationController = require('./authentication.controller');
var usersTransforms = require('../users/users.transforms');

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
        return res.sendStatus(401);
      }

      req.logIn(user, function(err) {
        if (err) {
          return next(err);
        }
        res.status(200).send(usersTransforms.fromCollection(user));
      });
    })(req, res, next);
  });

  context.app.use(function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
      return next();
    }

    // if they aren't redirect them to the home page
    res.sendStatus(401);
  });
}
