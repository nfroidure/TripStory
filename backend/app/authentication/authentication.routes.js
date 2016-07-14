'use strict';

const JWT_DEFAULT_DURATION = 24 * 60 * 60 * 1000; // 1 day

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const reaccess = require('express-reaccess');

const initAuthenticationController = require('./authentication.controller');
const usersTransforms = require('../users/users.transforms');
const YHTTPError = require('yhttperror');
const authenticationUtils = require('./authentication.utils');
const initBasicAuth = require('./authentication.middleware');
const jwt = require('json-web-token');

module.exports = initAuthenticationRoutes;

function initAuthenticationRoutes(context) {
  context.passport = initAuthenticationController(context);

  context.app.use(session({
    secret: context.env.SESSION_SECRET,
    store: new MongoStore({ db: context.db }),
  }));
  context.app.use(context.passport.initialize());
  context.app.use(context.passport.session());
  context.app.use((req, res, next) => {
    if(
      req.headers && req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      context.passport.authenticate('jwt', { session: false })(req, res, next);
      return;
    }
    next();
  });
  context.app.use(((basicAuth) => {
    return (req, res, next) => {
      if(
        req.headers && req.headers.authorization &&
        req.headers.authorization.startsWith('Basic')
      ) {
        basicAuth(req, res, next);
        return;
      }
      next();
    };
  })(initBasicAuth(context)));
  context.app.use((req, res, next) => {
    req._rights = authenticationUtils.createDefaultRights();
    if(!req.user) {
      next();
      return;
    }
    if(!req.user.rights) {
      next(new YHTTPError('E_USER_WITHOUT_RIGHTS', req.user._id));
      return;
    }
    req._rights = req._rights.concat(req.user.rights);
    next();
  });
  context.app.use(reaccess({
    rightsProps: ['_rights'],
    valuesProps: ['user'],
    accessErrorMessage: 'E_UNAUTHORIZED',
  }));

  context.app.post('/api/v0/tokens', (req, res, next) => {
    context.passport.authenticate('local', {
      failWithError: true,
      badRequestMessage: 'E_BAD_CREDENTIALS',
    }, (err, user, message, status) => {
      let tokenPayload;

      if(err) {
        next(YHTTPError.cast(err));
        return;
      }

      if(!user) {
        next(new YHTTPError(status, message.message));
        return;
      }

      tokenPayload = {
        iss: 'TripStory',
        aud: 'World',
        sub: user._id.toString(),
        iat: Math.round((
          context.time() + (
            context.env.JWT_DURATION ?
            parseInt(context.env.JWT_DURATION, 10) :
            JWT_DEFAULT_DURATION
          )
        ) / 1000),
      };

      jwt.encode(context.env.JWT_SECRET, tokenPayload, (err, token) => {
        if(err) {
          next(YHTTPError.wrap(err, 'E_TOKEN_ERROR', user._id));
          return;
        }
        res.status(200).send({
          _id: user._id,
          token,
          payload: tokenPayload,
        });
        context.bus.trigger({
          exchange: 'A_JWT_TOKEN',
          contents: {
            user_id: user._id,
            ip: req.ip,
          },
        });
      });
    })(req, res, next);
  });

  context.app.post('/api/v0/login', (req, res, next) => {
    context.passport.authenticate('local', {
      failWithError: true,
      badRequestMessage: 'E_BAD_CREDENTIALS',
    }, (err, user, message, status) => {
      if(err) {
        next(YHTTPError.cast(err));
        return;
      }

      if(!user) {
        next(new YHTTPError(status, message.message));
        return;
      }

      req.logIn(user, err => {
        if(err) {
          next(YHTTPError.cast(err));
          return;
        }
        context.bus.trigger({
          exchange: 'A_LOCAL_LOGIN',
          contents: {
            user_id: user._id,
            ip: req.ip,
          },
        });
        res.status(200).send(usersTransforms.fromCollection(user));
      });
    })(req, res, next);
  });

  context.app.post('/api/v0/signup', (req, res, next) => {
    context.passport.authenticate('local-signup', (err, user) => {
      if(err) {
        next(YHTTPError.cast(err));
        return;
      }
      if(!user) {
        res.sendStatus(401);
        return;
      }
      req.logIn(user, err => {
        if(err) {
          next(YHTTPError.cast(err));
          return;
        }
        context.bus.trigger({
          exchange: 'A_LOCAL_SIGNUP',
          contents: {
            user_id: user._id,
            ip: req.ip,
          },
        });
        res.status(201).send(usersTransforms.fromCollection(user));
      });
    })(req, res, next);
  });

  context.app.post('/api/v0/logout', (req, res) => {
    context.bus.trigger({
      exchange: 'A_LOGOUT',
      contents: {
        user_id: req.user._id,
        ip: req.ip,
      },
    });
    req.logout();
    req.session.destroy();
    res.sendStatus(204);
  });

  context.app.get(
    '/auth/facebook',
    authenticationUtils.initPassportWithAStateObject(context, 'facebook',
    { scope: ['public_profile', 'email', 'user_friends'] }
  ));
  context.app.get(
    '/auth/facebook/callback',
    authenticationUtils.checkStateObjectAndPassport(
      context, 'facebook', { failureRedirect: '/me' }
    ),
    authenticationUtils.redirectToApp.bind(null, context)
  );

  context.app.get(
    '/auth/google',
    authenticationUtils.initPassportWithAStateObject(context, 'google',
    { scope: ['profile', 'email'] }
  ));

  context.app.get(
    '/auth/google/callback',
    authenticationUtils.checkStateObjectAndPassport(
      context, 'google', { failureRedirect: '/me' }
    ),
    authenticationUtils.redirectToApp.bind(null, context)
  );

  context.app.get(
    '/auth/twitter',
    authenticationUtils.initPassportWithAStateObject(context, 'twitter',
    { scope: ['profile', 'email'] }
  ));
  context.app.get(
    '/auth/twitter/callback',
    authenticationUtils.checkStateObjectAndPassport(
      context, 'twitter', { failureRedirect: '/me' }
    ),
    authenticationUtils.redirectToApp.bind(null, context)
  );

  context.app.get(
    '/auth/xee',
    authenticationUtils.initPassportWithAStateObject(context, 'xee',
    { scope: [
      'user_get', 'email_get', 'car_get', 'data_get',
      'location_get', 'address_all', 'accelerometer_get',
    ] }
  ));
  context.app.get(
    '/auth/xee/callback',
    authenticationUtils.checkStateObjectAndPassport(
      context, 'xee', { failureRedirect: '/me' }
    ),
    authenticationUtils.redirectToApp.bind(null, context)
  );

  context.app.get(
    '/api/v0/profile',
    authenticationUtils.redirectToProfile.bind(null, context)
  );

  context.app.get(
    '/api/v0/me',
    context.passport.authenticate('basic', { session: false }),
    authenticationUtils.redirectToProfile.bind(null, context)
  );

}
