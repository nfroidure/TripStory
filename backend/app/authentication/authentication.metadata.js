'use strict';

const metadataUtils = require('../utils/metadata');
const usersSchema = require('../users/users.schema');

const authenticationMetadata = {
  [metadataUtils.apiPrefix + 'profile']: {
    GET: {
      controllers: ['redirectToProfile'],
      summary: 'Retrieve authenticated user',
      description: '',
      parameters: [],
      responseBody: 'user',
      tags: ['Auth'],
      successResponses: {
        301: {
          type: 'raw',
          description: 'Redirect to the authenticated user profile.',
        },
      },
      errorResponses: {
        401: {
          codes: ['E_UNAUTHORIZED'],
          description: 'Cannot access this resource.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
  [metadataUtils.apiPrefix + 'me']: {
    GET: {
      controllers: ['basicAuth', 'redirectToProfile'],
      summary: 'Retrieve authenticated user',
      description: 'Trigger a basic authentication header if not authenticated.',
      parameters: [],
      responseBody: 'user',
      tags: ['Auth'],
      successResponses: {
        301: {
          type: 'raw',
          description: 'Redirect to the authenticated user profile.',
        },
      },
      errorResponses: {
        401: {
          codes: ['E_UNAUTHORIZED'],
          description: 'Cannot access this resource.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
  [metadataUtils.apiPrefix + 'tokens']: {
    POST: {
      controllers: ['postToken'],
      summary: 'Create a JSON Web Token',
      description: '',
      parameters: [],
      tags: ['Auth'],
      successResponses: {
        200: {
          type: 'raw',
          description: 'Tokens successfully created.',
          schema: {},
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
  [metadataUtils.apiPrefix + 'login']: {
    POST: {
      controllers: ['login'],
      summary: 'Login with sessions',
      description: '',
      parameters: [],
      tags: ['Auth'],
      successResponses: {
        200: {
          description: 'Successfully logged in.',
          type: 'entry',
          schema: usersSchema,
        },
      },
      errorResponses: {
        400: {
          codes: ['E_BAD_CREDENTIALS'],
          description: 'Bad credentials.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
  [metadataUtils.apiPrefix + 'signup']: {
    POST: {
      controllers: ['signup'],
      summary: 'Signup',
      description: '',
      parameters: [],
      tags: ['Auth'],
      successResponses: {
        201: {
          description: 'Successfully signed up.',
          type: 'entry',
          schema: usersSchema,
        },
      },
      errorResponses: {
        400: {
          codes: ['E_BAD_CREDENTIALS'],
          description: 'Bad credentials.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
  [metadataUtils.apiPrefix + 'logout']: {
    POST: {
      controllers: ['logout'],
      summary: 'Log out from sessions',
      description: '',
      parameters: [],
      tags: ['Auth'],
      successResponses: {
        204: {
          description: 'Successfully logged out.',
          type: 'none',
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
