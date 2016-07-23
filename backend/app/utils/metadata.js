'use strict';

const metadataUtils = {
  apiPrefix: '/api/v0',
  statusCodes: {
    200: {
      code: 200,
      name: 'Ok',
      description: 'Everything went well.',
    },
    201: {
      code: 201,
      name: 'Created',
      description: 'Resource were created or updated.',
    },
    500: {
      code: 500,
      name: 'Server error',
      description: 'We fucked up.',
    },
    400: {
      code: 400,
      name: 'Bad contents',
      description: 'You fucked up.',
    },
    410: {
      code: 410,
      name: 'Gone',
      description: 'RIP Resource.',
    },
  },
};

module.exports = metadataUtils;
