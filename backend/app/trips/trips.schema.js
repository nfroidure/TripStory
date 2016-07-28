'use strict';

const schemaUtils = require('../utils/schema');

const tripsSchema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'Trip',
  type: 'object',
  additionalProperties: false,
  required: [
    'title', 'friends_ids',
  ],
  properties: {
    title: {
      description: 'Trip title',
      type: 'string',
    },
    description: {
      description: 'Some more informations about the trip',
      type: 'string',
    },
    car_id: schemaUtils.mongoId('The car involved in the trip'),
    friends_ids: schemaUtils.mongoIds('The friends doing the trip'),
  },
};

module.exports = tripsSchema;
