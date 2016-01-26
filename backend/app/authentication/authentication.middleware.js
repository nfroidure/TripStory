'use strict';

var authUtils = require('http-auth-utils');

module.exports = initBasicAuth;

function initBasicAuth(context) {
  return function(req, res, next) {
    var data;

    if(!req.headers.authorization) {
      return next();
    }
    data = authUtils.parseAuthorizationHeader(req.headers.authorization).data;

    context.db.collection('users').findOne({
      'contents.email': data.username,
      password: data.password,
    }).then(function basicAuthUserHandler(user) {
      if(!user) {
        context.logger.debug('Bad login attempt:', data);
        return res.sendStatus(401);
      }
      req.user = user;
      next();
    }).catch(next);
  };
}
