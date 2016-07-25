'use strict';

const metadataUtils = require('../utils/metadata');

const authenticationMetadata = {
  [metadataUtils.oauthPrefix + '/facebook']: {
    GET: {
      controllers: ['facebook'],
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/facebook/callback']: {
    GET: {
      controllers: ['facebookCallback', 'redirectToApp'],
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/google']: {
    GET: {
      controllers: ['google'],
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/google/callback']: {
    GET: {
      controllers: ['googleCallback', 'redirectToApp'],
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/twitter']: {
    GET: {
      controllers: ['twitter'],
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/twitter/callback']: {
    GET: {
      controllers: ['twitterCallback', 'redirectToApp'],
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/xee']: {
    GET: {
      controllers: ['xee'],
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/xee/callback']: {
    GET: {
      controllers: ['xeeCallback', 'redirectToApp'],
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
};

module.exports = authenticationMetadata;
