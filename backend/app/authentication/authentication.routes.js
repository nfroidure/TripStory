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

  context.app.post('/api/v0/logout', context.checkAuth, function authLogout(req, res) {
    req.logout();
    res.sendStatus(204);
  });

  context.app.get('/auth/facebook', passport.authenticate('facebook'));
  context.app.get(
    '/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/me' }),
    function(req, res) {
      res.redirect('/api/v0/profile');
    }
  );

  context.app.get(
    '/api/v0/profile',
    context.checkAuth,
    authRedirectToProfile
  );

  context.app.get(
    '/api/v0/me',
    passport.authenticate('basic', { session: false }),
    authRedirectToProfile
  );

  function authRedirectToProfile(req, res, next) {
    if(!req.user) {
      return res.send(401);
    }
    res.setHeader('Location', '/api/v0/users/' + req.user._id.toString());
    res.sendStatus(301);
  }
}
