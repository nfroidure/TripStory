'use strict';

const metadataUtils = require('../utils/metadata');

const carsMetadata = {
  [metadataUtils.apiPrefix + '/cars']: {
    GET: {
      controllers: ['list'],
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
      controllers: ['list'],
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
      controllers: ['get'],
      requestBody: '',
      requestQuery: [],
      responseBody: 'car',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    DELETE: {
      controllers: ['delete'],
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
