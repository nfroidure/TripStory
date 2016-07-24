'use strict';

const metadataUtils = require('../utils/metadata');

const tripsMetadata = {
  [metadataUtils.apiPrefix + '/trips']: {
    GET: {
      controller: 'list',
      requestBody: '',
      requestQuery: [],
      responseBody: 'tripLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/users/:user_id/trips']: {
    GET: {
      controller: 'list',
      requestBody: '',
      requestQuery: [],
      responseBody: 'tripLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/users/:user_id/trips/:trip_id']: {
    GET: {
      controller: 'get',
      requestBody: '',
      requestQuery: [],
      responseBody: 'trip',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    PUT: {
      controller: 'put',
      requestBody: '',
      requestQuery: [],
      responseBody: 'trip',
      responseCodes: {
        201: metadataUtils.statusCodes['201'],
        400: metadataUtils.statusCodes['400'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    DELETE: {
      controller: 'delete',
      requestBody: '',
      requestQuery: [],
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
