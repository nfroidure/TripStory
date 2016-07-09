'use strict';

const authUtils = require('http-auth-utils');
const authenticationUtils = require('./authentication.utils');

module.exports = initBasicAuth;

function initBasicAuth(context) {
  return (req, res, next) => {
    let data;

    if(!req.headers.authorization) {
      return next();
    }
    data = authUtils.parseAuthorizationHeader(req.headers.authorization).data;

    context.db.collection('users').findOne({
      emailKeys: { $all: [authenticationUtils.normalizeEmail(data.username)] },
    }).then((user) => {
      if(!user) {
        context.logger.debug('Unknown user:', data.username);
        return res.sendStatus(401);
      }

      return authenticationUtils.comparePasswordToHash(data.password, user.passwordHash)
        .then((matched) => {
          if(!matched) {
            context.logger.debug('Bad password:', data.username);
            return res.sendStatus(401);
          }
          context.logger.info('Authenticated a user:', user._id, user.contents.name);
          req.user = user;
          next();
        });
    }).catch(next);
  };
}
