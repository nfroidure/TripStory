'use strict';

const metadataUtils = require('../utils/metadata');

const usersMetadata = {
  [metadataUtils.apiPrefix + '/users']: {
    GET: {
      controller: 'list',
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
      controller: 'get',
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
      controller: 'put',
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
      controller: 'delete',
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
      controller: 'putAvatar',
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
      controller: 'listFriends',
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
      controller: 'inviteFriend',
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
