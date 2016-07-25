'use strict';

const metadataUtils = require('../utils/metadata');

const authenticationMetadata = {
  [metadataUtils.apiPrefix + '/profile']: {
    GET: {
      controllers: ['redirectToProfile'],
      requestBody: '',
      requestQuery: [],
      responseBody: '',
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
      requestBody: '',
      requestQuery: [],
      responseBody: '',
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
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/login']: {
    POST: {
      controllers: ['login'],
      requestBody: '',
      requestQuery: [],
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
      requestBody: '',
      requestQuery: [],
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
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        204: metadataUtils.statusCodes['204'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
};

module.exports = authenticationMetadata;
