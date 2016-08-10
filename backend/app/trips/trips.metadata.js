'use strict';

const metadataUtils = require('../utils/metadata');
const tripsSchema = require('./trips.schema');

const tripsMetadata = {
  [metadataUtils.apiPrefix + 'trips']: {
    GET: {
      controllers: ['list'],
      summary: 'List all trips',
      description: '',
      parameters: [],
      tags: ['Trips'],
      successResponses: {
        200: {
          type: 'collection',
          schema: tripsSchema,
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
  [metadataUtils.apiPrefix + 'users/:user_id/trips']: {
    GET: {
      controllers: ['list'],
      summary: 'List a user\'s trips',
      description: '',
      parameters: [],
      tags: ['Trips'],
      responseBody: 'tripLists',
      successResponses: {
        200: {
          type: 'collection',
          schema: tripsSchema,
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
  [metadataUtils.apiPrefix + 'users/:user_id/trips/:trip_id']: {
    GET: {
      controllers: ['get'],
      summary: 'Retrieve a user\'s trip',
      description: '',
      parameters: [],
      tags: ['Trips'],
      successResponses: {
        200: {
          type: 'entry',
          schema: tripsSchema,
        },
      },
      errorResponses: {
        410: {
          codes: ['E_NOT_FOUND'],
          description: 'The trip does not exist.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
    PUT: {
      controllers: ['put'],
      summary: 'Create/edit a user\'s trip',
      description: '',
      parameters: [
        {
          name: 'body',
          in: 'body',
        }
      ],
      tags: ['Trips'],
      successResponses: {
        201: {
          type: 'entry',
          schema: tripsSchema,
        },
      },
      errorResponses: {
        400: {
          codes: ['E_BAD_PAYLOAD'],
          description: 'Given trip is invalid.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
    DELETE: {
      controllers: ['delete'],
      summary: 'Delete a user\'s trip',
      description: '',
      parameters: [],
      tags: ['Trips'],
      successResponses: {
        410: {
          description: 'The trip does not exist.',
          type: 'entry',
          schema: tripsSchema,
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

module.exports = tripsMetadata;
