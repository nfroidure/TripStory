'use strict';

const metadataUtils = {
  apiPrefix: '/api/v0/',
  oauthPrefix: '/auth/',
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
    204: {
      code: 204,
      name: 'No Content',
      description: 'Everything went well but no content.',
    },
    301: {
      code: 301,
      name: 'Redirect',
      description: 'Resource is elsewhere.',
    },
    400: {
      code: 400,
      name: 'Bad contents',
      description: 'You fucked up.',
    },
    401: {
      code: 401,
      name: 'Unauthorized',
      description: 'Authentication is required',
    },
    403: {
      code: 403,
      name: 'Forbidden',
      description: 'Authenticated user cannot acccess this resource',
    },
    410: {
      code: 410,
      name: 'Gone',
      description: 'RIP Resource.',
    },
    500: {
      code: 500,
      name: 'Server error',
      description: 'We fucked up.',
    },
  },
};


module.exports = metadataUtils;
