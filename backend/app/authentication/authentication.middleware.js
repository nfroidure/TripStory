'use strict';

var authUtils = require('http-auth-utils');
var authenticationUtils = require('./authentication.utils');

module.exports = initBasicAuth;

function initBasicAuth(context) {
  return function(req, res, next) {
    var data;

    if(!req.headers.authorization) {
      return next();
    }
    data = authUtils.parseAuthorizationHeader(req.headers.authorization).data;

    context.db.collection('users').findOne({
      emailKeys: { $all: [authenticationUtils.normalizeEmail(data.username)] },
    }).then(function basicAuthUserHandler(user) {
      if(!user) {
        context.logger.debug('Unknown user:', data.username);
        return res.sendStatus(401);
      }

      return authenticationUtils.comparePasswordToHash(password, user.passwordHash)
        .then(function(matched) {
          if (!matched) {
            context.logger.debug('Bad password:', data.username);
            return res.sendStatus(401);
          }
          context.logger.info('Authenticated a user:', user._id, user.name);
          req.user = user;
          next();
        });
    }).catch(next);
  };
}
