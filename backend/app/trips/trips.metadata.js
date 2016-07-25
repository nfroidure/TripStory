'use strict';

const metadataUtils = require('../utils/metadata');

const tripsMetadata = {
  [metadataUtils.apiPrefix + '/trips']: {
    GET: {
      controllers: ['list'],
      summary: 'List all trips',
      description: '',
      parameters: [],
      tags: ['Trips'],
      responseBody: 'tripLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/users/:user_id/trips']: {
    GET: {
      controllers: ['list'],
      summary: 'List a user\'s trips',
      description: '',
      parameters: [],
      tags: ['Trips'],
      responseBody: 'tripLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/users/:user_id/trips/:trip_id']: {
    GET: {
      controllers: ['get'],
      summary: 'Retrieve a user\'s trip',
      description: '',
      parameters: [],
      tags: ['Trips'],
      responseBody: 'trip',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    PUT: {
      controllers: ['put'],
      summary: 'Create/edit a user\'s trip',
      description: '',
      parameters: [],
      tags: ['Trips'],
      responseBody: 'trip',
      responseCodes: {
        201: metadataUtils.statusCodes['201'],
        400: metadataUtils.statusCodes['400'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    DELETE: {
      controllers: ['delete'],
      summary: 'Delete a user\'s trip',
      description: '',
      parameters: [],
      tags: ['Trips'],
      responseBody: 'trip',
      responseCodes: {
        400: metadataUtils.statusCodes['400'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
};

module.exports = tripsMetadata;
