'use strict';


const routesUtils = require('../utils/routes');
const oauthMetadata = require('./oauth.metadata');
const initOAuthController = require('./oauth.controller');

module.exports = initAuthenticationRoutes;

function initAuthenticationRoutes(context) {
  const oauthController = initOAuthController(context);

  routesUtils.setupRoutesFromMetadata(
    context, oauthController, oauthMetadata
  );

}
