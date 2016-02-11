'use strict';

var TOKEN_DURATION = 60 * 60 * 1000; // 1 hour to log in

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var initAuthenticationController = require('./authentication.controller');
var usersTransforms = require('../users/users.transforms');
var clone = require('clone');
var YHTTPError = require('yhttperror');

module.exports = initAuthenticationRoutes;

function initAuthenticationRoutes(context) {
  var passport = initAuthenticationController(context);

  context.app.use(session({
    secret: context.env.SESSION_SECRET,
    store: new MongoStore({ db: context.db }),
  }));
  context.app.use(passport.initialize());
  context.app.use(passport.session());

  context.app.post('/api/v0/login', function(req, res, next) {
    passport.authenticate('local', {
      failWithError: true,
      badRequestMessage: 'E_BAD_CREDENTIALS',
    }, function(err, user, message, status) {
      if(err) {
        return next(YHTTPError.cast(err));
      }

      if(!user) {
        return next(new YHTTPError(status, message.message));
      }

      req.logIn(user, function(err) {
        if (err) {
          return next(YHTTPError.cast(err));
        }
        res.status(200).send(usersTransforms.fromCollection(user));
      });
    })(req, res, next);
  });

  context.app.post('/api/v0/signup', function(req, res, next) {
    passport.authenticate('local-signup', function(err, user) {
      if (err) {
        return next(YHTTPError.cast(err));
      }
      if (!user) {
        return res.sendStatus(401);
      }
      req.logIn(user, function(err) {
        if (err) {
          return next(YHTTPError.cast(err));
        }
        res.status(201).send(usersTransforms.fromCollection(user));
      });
    })(req, res, next);
  });

  context.app.post('/api/v0/logout', context.checkAuth, function authLogout(req, res) {
    req.logout();
    req.session.destroy();
    res.sendStatus(204);
  });

  context.app.get(
    '/auth/facebook',
    initPassportWithAStateObject('facebook',
    { scope: ['public_profile', 'email', 'user_friends'] }
  ));
  context.app.get(
    '/auth/facebook/callback',
    checkStateObjectAndPassport('facebook', { failureRedirect: '/me' }),
    authRedirectToApp
  );

  context.app.get(
    '/auth/google',
    initPassportWithAStateObject('google',
    { scope: ['profile', 'email'] }
  ));

  context.app.get(
    '/auth/google/callback',
    checkStateObjectAndPassport('google', { failureRedirect: '/me' }),
    authRedirectToApp
  );

  context.app.get(
    '/auth/twitter',
    initPassportWithAStateObject('twitter',
    { scope: ['profile', 'email'] }
  ));
  context.app.get(
    '/auth/twitter/callback',
    checkStateObjectAndPassport('twitter', { failureRedirect: '/me' }),
    authRedirectToApp
  );

  context.app.get(
    '/auth/xee',
    initPassportWithAStateObject('xee',
    { scope: [
      'user_get', 'email_get', 'car_get', 'data_get',
      'location_get', 'address_all', 'accelerometer_get',
    ] }
  ));
  context.app.get(
    '/auth/xee/callback',
    checkStateObjectAndPassport('xee', { failureRedirect: '/me' }),
    authRedirectToApp
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

  function authRedirectToApp(req, res) {
    if(!req.user) {
      return res.send(401);
    }
    res.setHeader('Location', context.base + '/#/app/trips');
    res.sendStatus(301);
  }

  function authRedirectToProfile(req, res) {
    if(!req.user) {
      return res.send(401);
    }
    res.setHeader('Location', context.base + '/api/v0/users/' + req.user._id.toString());
    res.sendStatus(301);
  }

  function initPassportWithAStateObject(type, params) {
    return function initPassportWithAStateObjectCb(req, res, next) {
      var stateContents = {
        type: type,
      };
      var state;

      params = clone(params);

      if(req.isAuthenticated()) {
        stateContents.user_id = req.session.passport.user;
      }
      if(req.user) {
        stateContents.user_id = req.user._id.toString();
      }
      state = context.tokens.createToken(
        stateContents,
        (new Date(context.time() + TOKEN_DURATION)).getTime()
      );
      params.state = (new Buffer(JSON.stringify(state))).toString('base64');
      // Extra glue for twitter OAuth1...
      if('twitter' === type) {
        params.callbackURL = context.base + '/auth/twitter/callback?state=' +
          params.state;
      }
      context.logger.debug('Assigned a state', state);
      passport.authenticate(type, params)(req, res, next);
    };
  }

  function checkStateObjectAndPassport(type, options) {
    return function checkStateObjectAndPassportCb(req, res, next) {
      var state;

      try {
        state = JSON.parse(new Buffer(req.query.state, 'base64').toString('utf8'));
        context.tokens.checkToken(state, state.hash);
      } catch(err) {
        return next(YHTTPError.cast(err));
      }
      context.logger.debug('Collected a state', state);
      req._authState = state;
      passport.authenticate(type, options)(req, res, next);
    };
  }
}
