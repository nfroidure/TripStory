'use strict';

const metadataUtils = require('../utils/metadata');

const carsMetadata = {
  [metadataUtils.apiPrefix + '/cars']: {
    GET: {
      controllers: ['list'],
      summary: 'List all cars',
      description: '',
      parameters: [],
      tags: ['Cars'],
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
      summary: 'List a user\'s cars',
      description: '',
      parameters: [],
      tags: ['Cars'],
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
      summary: 'Retrieve a user\'s car',
      description: '',
      parameters: [],
      tags: ['Cars'],
      responseBody: 'car',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    DELETE: {
      controllers: ['delete'],
      summary: 'Delete a user\'s car',
      description: '',
      parameters: [],
      tags: ['Cars'],
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
