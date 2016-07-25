'use strict';

const metadataUtils = require('../utils/metadata');
const URL_PARAMETER = {
  name: 'url',
  in: 'query',
  description: 'URL to redirect to after login.',
  required: false,
  type: 'string',
  format: 'url',
};

const authenticationMetadata = {
  [metadataUtils.oauthPrefix + '/facebook']: {
    GET: {
      controllers: ['facebook'],
      summary: 'Login via Facebook OAuth',
      description: '',
      parameters: [URL_PARAMETER],
      tags: ['Auth', 'Facebook'],
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/facebook/callback']: {
    GET: {
      controllers: ['facebookCallback', 'redirectToApp'],
      summary: 'Facebook OAuth callback',
      description: '',
      parameters: [],
      tags: ['Auth', 'Facebook'],
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/google']: {
    GET: {
      controllers: ['google'],
      summary: 'Login via Google OAuth',
      description: '',
      parameters: [URL_PARAMETER],
      tags: ['Auth', 'Google'],
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/google/callback']: {
    GET: {
      controllers: ['googleCallback', 'redirectToApp'],
      summary: 'Google OAuth callback',
      description: '',
      parameters: [],
      tags: ['Auth', 'Google'],
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/twitter']: {
    GET: {
      controllers: ['twitter'],
      summary: 'Login via Twitter OAuth',
      description: '',
      parameters: [URL_PARAMETER],
      tags: ['Auth', 'Twitter'],
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/twitter/callback']: {
    GET: {
      controllers: ['twitterCallback', 'redirectToApp'],
      summary: 'Twitter OAuth callback',
      description: '',
      parameters: [],
      tags: ['Auth', 'Twitter'],
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/xee']: {
    GET: {
      controllers: ['xee'],
      summary: 'Login via Xee OAuth',
      description: '',
      parameters: [URL_PARAMETER],
      tags: ['Auth', 'Xee'],
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.oauthPrefix + '/xee/callback']: {
    GET: {
      controllers: ['xeeCallback', 'redirectToApp'],
      summary: 'Xee OAuth callback',
      description: '',
      parameters: [],
      tags: ['Auth', 'Xee'],
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
};

module.exports = authenticationMetadata;
