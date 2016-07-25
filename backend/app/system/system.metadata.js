'use strict';

const metadataUtils = require('../utils/metadata');

const systemsMetadata = {
  '/ping': {
    GET: {
      controllers: ['ping'],
      summary: 'Ping',
      description: '',
      parameters: [],
      tags: ['System'],
      responseBody: 'pong',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  '/bus': {
    POST: {
      controllers: ['triggerEvent'],
      summary: 'Trigger an event in the bus',
      description: '',
      parameters: [],
      tags: ['System', 'Events'],
      responseBody: 'event',
      responseCodes: {
        201: metadataUtils.statusCodes['201'],
        400: metadataUtils.statusCodes['400'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
};

module.exports = systemsMetadata;
