'use strict';

const metadataUtils = require('../utils/metadata');

const eventsMetadata = {
  [metadataUtils.apiPrefix + '/events']: {
    GET: {
      controllers: ['list'],
      summary: 'List all events',
      description: '',
      parameters: [],
      tags: ['Events'],
      responseBody: 'eventLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
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
      responseBody: 'eventLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
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
      responseBody: 'event',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    PUT: {
      controllers: ['put'],
      summary: 'Create/edit a user\'s event',
      description: '',
      parameters: [],
      tags: ['Events'],
      responseBody: 'event',
      responseCodes: {
        201: metadataUtils.statusCodes['201'],
        400: metadataUtils.statusCodes['400'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    DELETE: {
      controllers: ['delete'],
      summary: 'DelEte a user\'s event',
      description: '',
      parameters: [],
      tags: ['Events'],
      responseBody: 'event',
      responseCodes: {
        400: metadataUtils.statusCodes['400'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
};

module.exports = eventsMetadata;
