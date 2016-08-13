'use strict';

const usersSchema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'User',
  type: 'object',
  additionalProperties: false,
  required: [
    'name', 'email',
  ],
  properties: {
    name: {
      type: 'string',
    },
    email: {
      type: 'string',
      format: 'email',
    },
    birth_date: {
      type: 'string',
      format: 'date-time',
    },
  },
};

module.exports = usersSchema;
