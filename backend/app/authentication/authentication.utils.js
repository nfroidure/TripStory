'use strict';

const bcrypt = require('bcrypt');
const jwt = require('json-web-token');
const clone = require('clone');
const reaccess = require('express-reaccess');
const YHTTPError = require('yhttperror');
const YError = require('yerror');

const DEFAULT_TOKEN_DURATION = 60 * 60 * 1000; // 1 hour to log in
const JWT_DEFAULT_DURATION = 24 * 60 * 60 * 1000; // 1 day

const authenticationUtils = {
  normalizeEmail: authenticationUtilsNormalizeEmail,
  createDefaultRights: authenticationUtilsCreateDefaultRights,
  createJWT: authenticationUtilsCreateJWT,
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

function authenticationUtilsCreateJWT(context, user) {
  const tokenPayload = {
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

  return new Promise((resolve, reject) => {
    jwt.encode(context.env.JWT_SECRET, tokenPayload, (err, token) => {
      if(err) {
        reject(YError.wrap(err, 'E_TOKEN_ERROR', user._id));
        return;
      }
      resolve({
        _id: user._id,
        token,
        payload: tokenPayload,
      });
    });
  });
}

function authenticationUtilsCreateDefaultRights() {
  return [{
    // OAuth rights
    path: '/auth/(facebook|xee|google|twitter)(/callback)?',
    methods: reaccess.READ_MASK,
  }, {
    // Login/signup/jwt
    path: '/api/v0/(login|signup|tokens)',
    methods: reaccess.POST,
  }, {
    // Basic authentication
    path: '/api/v0/me',
    methods: reaccess.READ_MASK,
  }, {
    // Swagger
    path: '/(api/v0/|)docs$',
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
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if(err) {
        reject(err);
        return;
      }
      bcrypt.hash(password, salt, (err2, hash) => {
        if(err2) {
          reject(err2);
          return;
        }
        resolve(hash);
      });
    });
  });
}

function authenticationUtilsComparePasswordToHash(password, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, res) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
}

function initPassportWithAStateObject(context, type, params) {
  return function initPassportWithAStateObjectCb(req, res, next) {
    const stateContents = {
      type,
    };
    let state;

    params = clone(params);

    if(req.isAuthenticated()) {
      stateContents.user_id = req.session.passport.user;
    }
    if(req.user) {
      stateContents.user_id = req.user._id.toString();
    }
    if(req.query.url) {
      stateContents.url = req.query.url;
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
      params.callbackURL = `${context.base}/auth/twitter/callback?state=${params.state}`;
    }
    context.logger.debug('Assigned a state', state);
    context.passport.authenticate(type, params)(req, res, next);
  };
}

function checkStateObjectAndPassport(context, type, options) {
  return function checkStateObjectAndPassportCb(req, res, next) {
    let state;

    try {
      state = JSON.parse(new Buffer(req.query.state, 'base64').toString('utf8'));
      context.tokens.checkToken(state, state.hash);
    } catch (err) {
      next(YHTTPError.cast(err));
      return;
    }
    context.logger.debug('Collected a state', state);
    req._authState = state;
    context.passport.authenticate(type, options)(req, res, next);
  };
}

function authenticationUtilsRedirectToApp(context, req, res, next) {
  if(!req.user) {
    res.send(401);
    return;
  }

  // Special case meaning we want a JWT back for native apps
  (
    req._authState.contents.url &&
    req._authState.contents.url.endsWith('/api/virtual/token') ?
    authenticationUtils.createJWT(context, req.user)
    .then((token) => {
      return `${context.base}/api/virtual/token/${token.token}`;
    }) :
    Promise.resolve(req._authState.contents.url || `${context.base}/#/app/trips`)
  )
  .then((redirectUrl) => {
    res.setHeader('Location', redirectUrl);
    res.sendStatus(301);
  })
  .catch(next);
}

function authenticationUtilsRedirectToProfile(context, req, res) {
  if(!req.user) {
    res.send(401);
    return;
  }
  res.setHeader('Location', `${context.base}/api/v0/users/${req.user._id.toString()}`);
  res.sendStatus(301);
}
