'use strict';

const authenticationUtils = require('./authentication.utils');
const YHTTPError = require('yhttperror');
const usersTransforms = require('../users/users.transforms');
const initAuthenticationStrategies = require('./authentication.strategies');

module.exports = initAuthenticationController;

function initAuthenticationController(context) {
  const authenticationController = {
    basicAuth: context.passport.authenticate('basic', { session: false }),
    postToken: authenticationControllerPostToken,
    login: authenticationControllerLogin,
    signup: authenticationControllerSignup,
    logout: authenticationControllerLogout,
    redirectToProfile: authenticationUtils.redirectToProfile.bind(null, context),
  };

  initAuthenticationStrategies(context);

  function authenticationControllerPostToken(req, res, next) {
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

      authenticationUtils.createJWT(context, user)
      .then((token) => {
        res.status(200).send(token);
        context.bus.trigger({
          exchange: 'A_JWT_TOKEN',
          contents: {
            user_id: user._id,
            ip: req.ip,
          },
        });
      })
      .catch(next);
    })(req, res, next);
  }

  function authenticationControllerLogin(req, res, next) {
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
  }

  function authenticationControllerSignup(req, res, next) {
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
  }

  function authenticationControllerLogout(req, res) {
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
  }

  return authenticationController;
}
