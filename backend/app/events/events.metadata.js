'use strict';

const metadataUtils = require('../utils/metadata');

const eventsMetadata = {
  [metadataUtils.apiPrefix + '/events']: {
    GET: {
      controller: 'list',
      requestBody: '',
      requestQuery: [],
      responseBody: 'eventLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/users/:user_id/events']: {
    GET: {
      controller: 'list',
      requestBody: '',
      requestQuery: [],
      responseBody: 'eventLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/users/:user_id/events/:event_id']: {
    GET: {
      controller: 'get',
      requestBody: '',
      requestQuery: [],
      responseBody: 'event',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    PUT: {
      controller: 'put',
      requestBody: '',
      requestQuery: [],
      responseBody: 'event',
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
