'use strict';

const metadataUtils = require('../utils/metadata');
const eventsSchema = require('./events.schema');

const eventsMetadata = {
  [metadataUtils.apiPrefix + '/events']: {
    GET: {
      controllers: ['list'],
      summary: 'List all events',
      description: '',
      parameters: [],
      tags: ['Events'],
      successResponses: {
        200: {
          type: 'collection',
          schema: eventsSchema,
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
  [metadataUtils.apiPrefix + '/users/:user_id/events']: {
    GET: {
      controllers: ['list'],
      summary: 'List a user\'s events',
      description: '',
      parameters: [],
      tags: ['Events'],
      successResponses: {
        200: {
          type: 'collection',
          schema: eventsSchema,
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
  [metadataUtils.apiPrefix + '/users/:user_id/events/:event_id']: {
    GET: {
      controllers: ['get'],
      summary: 'Retrieve a user\'s event',
      description: '',
      parameters: [],
      tags: ['Events'],
      successResponses: {
        200: {
          type: 'entry',
          schema: eventsSchema,
        },
      },
      errorResponses: {
        410: {
          codes: ['E_NOT_FOUND'],
          description: 'The event does not exist.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
    PUT: {
      controllers: ['put'],
      summary: 'Create/edit a user\'s event',
      description: '',
      parameters: [],
      tags: ['Events'],
      successResponses: {
        201: {
          type: 'entry',
          schema: eventsSchema,
        },
      },
      errorResponses: {
        400: {
          codes: ['E_BAD_PAYLOAD'],
          description: 'The given event is malformed.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
      responseBody: 'event',
      responseCodes: {
        201: metadataUtils.statusCodes['201'],
        400: metadataUtils.statusCodes['400'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    DELETE: {
      controllers: ['delete'],
      summary: 'Delete a user\'s event',
      description: '',
      parameters: [],
      tags: ['Events'],
      successResponses: {
        410: {
          description: 'The event does not exist.',
        },
      },
      errorResponses: {
        400: {
          codes: ['E_UNDELETABLE_EVENT'],
          description: 'Cannot delete this type of event.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
};

module.exports = eventsMetadata;
