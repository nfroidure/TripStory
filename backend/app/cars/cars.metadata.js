'use strict';

const metadataUtils = require('../utils/metadata');
const carsSchema = require('./cars.schema');

const carsMetadata = {
  [metadataUtils.apiPrefix + 'cars']: {
    GET: {
      controllers: ['list'],
      summary: 'List all cars',
      description: '',
      parameters: [],
      tags: ['Cars'],
      successResponses: {
        200: {
          type: 'collection',
          schema: carsSchema,
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
  [metadataUtils.apiPrefix + 'users/:user_id/cars']: {
    GET: {
      controllers: ['list'],
      summary: 'List a user\'s cars',
      description: '',
      parameters: [],
      tags: ['Cars'],
      successResponses: {
        200: {
          type: 'collection',
          schema: carsSchema,
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
  [metadataUtils.apiPrefix + 'users/:user_id/cars/:car_id']: {
    GET: {
      controllers: ['get'],
      summary: 'Retrieve a user\'s car',
      description: '',
      parameters: [],
      tags: ['Cars'],
      responseBody: 'car',
      successResponses: {
        200: {
          type: 'entry',
          schema: carsSchema,
        },
      },
      errorResponses: {
        410: {
          codes: ['E_NOT_FOUND'],
          description: 'The car does not exist.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
    DELETE: {
      controllers: ['delete'],
      summary: 'Delete a user\'s car',
      description: '',
      parameters: [],
      tags: ['Cars'],
      successResponses: {
        410: {
          type: 'entry',
          schema: carsSchema,
          description: 'The car does not exist.',
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
};

module.exports = carsMetadata;
