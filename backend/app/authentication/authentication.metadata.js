'use strict';

const metadataUtils = require('../utils/metadata');

const authenticationMetadata = {
  [metadataUtils.apiPrefix + '/profile']: {
    GET: {
      controllers: ['redirectToProfile'],
      summary: 'Retrieve authenticated user',
      description: '',
      parameters: [],
      responseBody: 'user',
      tags: ['Auth'],
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        401: metadataUtils.statusCodes['401'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/me']: {
    GET: {
      controllers: ['basicAuth', 'redirectToProfile'],
      summary: 'Retrieve authenticated user',
      description: 'Trigger a basic authentication header if not authenticated.',
      parameters: [],
      responseBody: 'user',
      tags: ['Auth'],
      responseCodes: {
        301: metadataUtils.statusCodes['301'],
        401: metadataUtils.statusCodes['401'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/tokens']: {
    POST: {
      controllers: ['postToken'],
      summary: 'Create a JSON Web Token',
      description: '',
      parameters: [],
      tags: ['Auth'],
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/login']: {
    POST: {
      controllers: ['login'],
      summary: 'Login with sessions',
      description: '',
      parameters: [],
      tags: ['Auth'],
      responseBody: 'user',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        400: metadataUtils.statusCodes['400'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/signup']: {
    POST: {
      controllers: ['signup'],
      summary: 'Signup',
      description: '',
      parameters: [],
      tags: ['Auth'],
      responseBody: 'user',
      responseCodes: {
        201: metadataUtils.statusCodes['201'],
        400: metadataUtils.statusCodes['400'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/logout']: {
    POST: {
      controllers: ['logout'],
      summary: 'Log out from sessions',
      description: '',
      parameters: [],
      tags: ['Auth'],
      responseCodes: {
        204: metadataUtils.statusCodes['204'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
};

module.exports = authenticationMetadata;
