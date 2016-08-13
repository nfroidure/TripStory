'use strict';

const schemaUtils = require('../utils/schema');

const carsSchema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'Car',
  type: 'object',
  additionalProperties: false,
  required: [
    'name', 'user_id', 'type',
  ],
  properties: {
    name: {
      description: 'Car name',
      type: 'string',
    },
    user_id: schemaUtils.mongoId('User owning the car'),
    brand: {
      description: 'Car brand',
      type: 'string',
    },
    type: {
      description: 'Car information issuer type',
      type: 'string',
      enum: ['xee'],
    },
    // TODO: store as a string
    xeeId: {
      description: 'Car issuer id',
      type: 'number',
    },
  },
};

module.exports = carsSchema;
