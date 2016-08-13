'use strict';

const metadataUtils = require('../utils/metadata');

const docsMetadata = {
  '/docs': {
    GET: {
      controllers: ['redirect'],
      summary: 'Redirect to API docs',
      description: '',
      parameters: [],
      tags: ['Docs', 'System'],
      successResponses: {
        301: {},
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
  [metadataUtils.apiPrefix + 'docs']: {
    GET: {
      controllers: ['get'],
      summary: 'Get the public API docs',
      description: '',
      parameters: [],
      tags: ['Docs', 'System'],
      successResponses: {
        200: {
          type: 'raw',
          // TODO: Add the Swagger JSON schema :)
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
  [metadataUtils.apiPrefix + 'docs/configuration']: {
    GET: {
      controllers: ['getConfiguration'],
      summary: 'Get the public API configuration',
      description: '',
      parameters: [],
      tags: ['Docs', 'System'],
      successResponses: {
        200: {
          type: 'raw',
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
  [metadataUtils.apiPrefix + 'users/:user_id/docs']: {
    GET: {
      controllers: ['get'],
      summary: 'Get a user\'s API docs',
      description: 'The API docs may vary depending on the user rights.',
      parameters: [],
      tags: ['Docs', 'System'],
      successResponses: {
        200: {
          type: 'raw',
          // TODO: Add the Swagger JSON schema :)
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

module.exports = docsMetadata;
