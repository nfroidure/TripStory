'use strict';

const schemaUtils = require('../utils/schema');

const eventsSchema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'eventsMetadata',
  type: 'object',
  additionalProperties: false,
  required: [
    'type', 'trip_id',
  ],
  properties: {
    trip_id: schemaUtils.mongoId(),
    type: {
      type: 'string',
      enum: ['xee-geo'],
    },
    geo: schemaUtils.mongoId(),
    address: {
      type: 'string',
    },
  },
};

module.exports = eventsSchema;
