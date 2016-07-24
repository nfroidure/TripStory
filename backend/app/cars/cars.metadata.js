'use strict';

const metadataUtils = require('../utils/metadata');

const carsMetadata = {
  [metadataUtils.apiPrefix + '/cars']: {
    GET: {
      controller: 'list',
      requestBody: '',
      requestQuery: [],
      responseBody: 'carLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/users/:user_id/cars']: {
    GET: {
      controller: 'list',
      requestBody: '',
      requestQuery: [],
      responseBody: 'carLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/users/:user_id/cars/:car_id']: {
    GET: {
      controller: 'get',
      requestBody: '',
      requestQuery: [],
      responseBody: 'car',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    DELETE: {
      controller: 'delete',
      requestBody: '',
      requestQuery: [],
      responseBody: 'car',
      responseCodes: {
        400: metadataUtils.statusCodes['400'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
};

module.exports = carsMetadata;
