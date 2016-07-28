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
      successResponses: {
        301: {
          type: 'raw',
          description: 'Redirect to the external authentication provider.',
        },
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
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
      successResponses: {
        301: {
          type: 'raw',
          description: 'Successfully authenticated.',
        },
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
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
      successResponses: {
        301: {
          type: 'raw',
          description: 'Redirect to the external authentication provider.',
        },
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
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
      successResponses: {
        301: {
          type: 'raw',
          description: 'Successfully authenticated.',
        },
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
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
      successResponses: {
        301: {
          type: 'raw',
          description: 'Redirect to the external authentication provider.',
        },
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
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
      successResponses: {
        301: {
          type: 'raw',
          description: 'Successfully authenticated.',
        },
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
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
      successResponses: {
        301: {
          type: 'raw',
          description: 'Redirect to the external authentication provider.',
        },
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
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
      successResponses: {
        301: {
          type: 'raw',
          description: 'Successfully authenticated.',
        },
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
};

module.exports = authenticationMetadata;
