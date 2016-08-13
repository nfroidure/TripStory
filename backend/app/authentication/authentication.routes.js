'use strict';

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const reaccess = require('express-reaccess');

const routesUtils = require('../utils/routes');
const authenticationMetadata = require('./authentication.metadata');
const initAuthenticationController = require('./authentication.controller');
const YHTTPError = require('yhttperror');
const authenticationUtils = require('./authentication.utils');
const initBasicAuth = require('./authentication.middleware');

module.exports = initAuthenticationRoutes;

function initAuthenticationRoutes(context) {
  const authenticationController = initAuthenticationController(context);

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
  context.app.use(reaccess(authenticationUtils.REACCESS_CONFIG));

  routesUtils.setupRoutesFromMetadata(
    context, authenticationController, authenticationMetadata
  );

}
