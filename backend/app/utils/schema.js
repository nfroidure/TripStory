'use strict';

const schemaUtils = {
  mongoId: schemaUtilsMongoId,
  mongoIds: schemaUtilsMongoIds,
  geo: schemaUtilsGeo,
};

module.exports = schemaUtils;

function schemaUtilsMongoIds(description) {
  return {
    description: description || '',
    type: 'array',
    uniqueItems: true,
    items: [schemaUtils.mongoId()],
  };
}

function schemaUtilsMongoId(description) {
  return {
    description: description || '',
    type: 'string',
    pattern: '^([0-9a-f]{24})$',
    minLength: 24,
    maxLength: 24,
  };
}

function schemaUtilsGeo() {
  return {
    type: 'array',
    minItems: 2,
    maxItems: 3,
    additionalItems: false,
    items: [{
      type: 'number',
      minimum: -90,
      maximum: 90,
      default: 0,
    }, {
      type: 'number',
      minimum: -180,
      maximum: +180,
      default: 0,
    }, {
      type: 'number',
      default: 0,
    }],
  };
}
