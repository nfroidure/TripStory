'use strict';

const authenticationUtils = require('./authentication.utils');
const initOAuthStrategies = require('./oauth.strategies');

module.exports = initAuthenticationController;

function initAuthenticationController(context) {
  const oAuthController = {
    facebook: oAuthControllerFacebook,
    facebookCallback: oAuthControllerFacebookCallback,
    google: oAuthControllerGoogle,
    googleCallback: oAuthControllerGoogleCallback,
    twitter: oAuthControllerTwitter,
    twitterCallback: oAuthControllerTwitterCallback,
    xee: oAuthControllerXee,
    xeeCallback: oAuthControllerXeeCallback,
    redirectToApp: authenticationUtils.redirectToApp.bind(null, context),
  };

  initOAuthStrategies(context);

  function oAuthControllerFacebook(...args) {
    authenticationUtils.initPassportWithAStateObject(context, 'facebook',
      { scope: ['public_profile', 'email', 'user_friends'] }
    )(...args);
  }
  function oAuthControllerFacebookCallback(...args) {
    authenticationUtils.checkStateObjectAndPassport(
      context, 'facebook', { failureRedirect: '/me' }
    )(...args);
  }
  function oAuthControllerGoogle(...args) {
    authenticationUtils.initPassportWithAStateObject(context, 'google',
      { scope: ['profile', 'email'] }
    )(...args);
  }
  function oAuthControllerGoogleCallback(...args) {
    authenticationUtils.checkStateObjectAndPassport(
      context, 'google', { failureRedirect: '/me' }
    )(...args);
  }
  function oAuthControllerTwitter(...args) {
    authenticationUtils.initPassportWithAStateObject(context, 'twitter',
      { scope: ['profile', 'email'] }
    )(...args);
  }
  function oAuthControllerTwitterCallback(...args) {
    authenticationUtils.checkStateObjectAndPassport(
      context, 'twitter', { failureRedirect: '/me' }
    )(...args);
  }
  function oAuthControllerXee(...args) {
    authenticationUtils.initPassportWithAStateObject(context, 'xee',
      { scope: [
        'user_get', 'email_get', 'car_get', 'data_get',
        'location_get', 'address_all', 'accelerometer_get',
      ] }
    )(...args);
  }
  function oAuthControllerXeeCallback(...args) {
    authenticationUtils.checkStateObjectAndPassport(
      context, 'xee', { failureRedirect: '/me' }
    )(...args);
  }

  return oAuthController;
}
