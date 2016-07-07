'use strict';

var bcrypt = require('bcrypt');
var clone = require('clone');
var reaccess = require('express-reaccess');
var YHTTPError = require('yhttperror');

var DEFAULT_TOKEN_DURATION = 60 * 60 * 1000; // 1 hour to log in

var authenticationUtils = {
  normalizeEmail: authenticationUtilsNormalizeEmail,
  createDefaultRights: authenticationUtilsCreateDefaultRights,
  createRights: authenticationUtilsCreateRights,
  createPasswordHash: authenticationUtilsCreatePasswordHash,
  comparePasswordToHash: authenticationUtilsComparePasswordToHash,
  initPassportWithAStateObject,
  checkStateObjectAndPassport,
  redirectToApp: authenticationUtilsRedirectToApp,
  redirectToProfile: authenticationUtilsRedirectToProfile,
};

module.exports = authenticationUtils;

function authenticationUtilsNormalizeEmail(email) {
  return email.toLowerCase().trim();
}

function authenticationUtilsCreateDefaultRights() {
  return [{
    // OAuth rights
    path: '/auth/(facebook|xee|google|twitter)(/callback)?',
    methods: reaccess.READ_MASK,
  }, {
    // Login/signup
    path: '/api/v0/(login|signup)',
    methods: reaccess.POST,
  }, {
    // Basic authentication
    path: '/api/v0/me',
    methods: reaccess.READ_MASK,
  }, {
    // Ping
    path: '/ping',
    methods: reaccess.READ_MASK,
  }];
}

function authenticationUtilsCreateRights() {
  return [{
    // User relative rights
    path: '/api/v0/users/:_id/?.*',
    methods: reaccess.ALL_MASK,
  }, {
    // Profile
    path: '/api/v0/profile',
    methods: reaccess.READ_MASK,
  }, {
    // Logout
    path: '/api/v0/logout',
    methods: reaccess.POST,
  }];
}

function authenticationUtilsCreatePasswordHash(password) {
  return new Promise(function(resolve, reject) {
    bcrypt.genSalt(10, function genSaltHandler(err, salt) {
      if(err) {
        return reject(err);
      }
      bcrypt.hash(password, salt, function hashHandler(err2, hash) {
        if(err2) {
          return reject(err2);
        }
        resolve(hash);
      });
    });
  });
}

function authenticationUtilsComparePasswordToHash(password, hash) {
  return new Promise(function(resolve, reject) {
    bcrypt.compare(password, hash, function compareHandler(err, res) {
      if(err) {
        return reject(err);
      }
      resolve(res);
    });
  });
}

function initPassportWithAStateObject(context, type, params) {
  return function initPassportWithAStateObjectCb(req, res, next) {
    var stateContents = {
      type,
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
      (new Date(
        context.time() +
        (context.env.TOKEN_DURATION || DEFAULT_TOKEN_DURATION)
      )).getTime()
    );
    params.state = (new Buffer(JSON.stringify(state))).toString('base64');
    // Extra glue for twitter OAuth1...
    if('twitter' === type) {
      params.callbackURL = context.base + '/auth/twitter/callback?state=' +
        params.state;
    }
    context.logger.debug('Assigned a state', state);
    context.passport.authenticate(type, params)(req, res, next);
  };
}

function checkStateObjectAndPassport(context, type, options) {
  return function checkStateObjectAndPassportCb(req, res, next) {
    var state;

    try {
      state = JSON.parse(new Buffer(req.query.state, 'base64').toString('utf8'));
      context.tokens.checkToken(state, state.hash);
    } catch (err) {
      return next(YHTTPError.cast(err));
    }
    context.logger.debug('Collected a state', state);
    req._authState = state;
    context.passport.authenticate(type, options)(req, res, next);
  };
}

function authenticationUtilsRedirectToApp(context, req, res) {
  if(!req.user) {
    return res.send(401);
  }
  res.setHeader('Location', context.base + '/#/app/trips');
  res.sendStatus(301);
}

function authenticationUtilsRedirectToProfile(context, req, res) {
  if(!req.user) {
    return res.send(401);
  }
  res.setHeader('Location', context.base + '/api/v0/users/' + req.user._id.toString());
  res.sendStatus(301);
}
