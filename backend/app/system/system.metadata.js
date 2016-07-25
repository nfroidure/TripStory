'use strict';

const metadataUtils = require('../utils/metadata');

const systemsMetadata = {
  '/ping': {
    GET: {
      controllers: ['ping'],
      requestBody: '',
      requestQuery: [],
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
      requestBody: '',
      requestQuery: [],
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
