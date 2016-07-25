'use strict';

const metadataUtils = require('../utils/metadata');

const usersMetadata = {
  [metadataUtils.apiPrefix + '/users']: {
    GET: {
      controllers: ['list'],
      requestBody: '',
      requestQuery: [],
      responseBody: 'userLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/users/:user_id']: {
    GET: {
      controllers: ['get'],
      requestBody: '',
      requestQuery: [],
      responseBody: 'user',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    PUT: {
      controllers: ['put'],
      requestBody: '',
      requestQuery: [],
      responseBody: 'user',
      responseCodes: {
        201: metadataUtils.statusCodes['201'],
        400: metadataUtils.statusCodes['400'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    DELETE: {
      controllers: ['delete'],
      requestBody: '',
      requestQuery: [],
      responseBody: 'user',
      responseCodes: {
        400: metadataUtils.statusCodes['400'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/users/:user_id/avatar']: {
    PUT: {
      controllers: ['putAvatar'],
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        201: metadataUtils.statusCodes['201'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
  [metadataUtils.apiPrefix + '/users/:user_id/friends']: {
    GET: {
      controllers: ['listFriends'],
      requestBody: '',
      requestQuery: [],
      responseBody: 'userLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    POST: {
      controllers: ['inviteFriend'],
      requestBody: '',
      requestQuery: [],
      responseBody: '',
      responseCodes: {
        201: metadataUtils.statusCodes['201'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
  },
};

module.exports = usersMetadata;
