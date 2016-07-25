'use strict';

const metadataUtils = require('../utils/metadata');

const usersMetadata = {
  [metadataUtils.apiPrefix + '/users']: {
    GET: {
      controllers: ['list'],
      summary: 'List all users',
      description: '',
      parameters: [],
      tags: ['User'],
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
      summary: 'Retrieve a user',
      description: '',
      parameters: [],
      tags: ['User'],
      responseBody: 'user',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    PUT: {
      controllers: ['put'],
      summary: 'Create/edit a user',
      description: '',
      parameters: [],
      tags: ['User'],
      responseBody: 'user',
      responseCodes: {
        201: metadataUtils.statusCodes['201'],
        400: metadataUtils.statusCodes['400'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    DELETE: {
      controllers: ['delete'],
      summary: 'Remove a user',
      description: '',
      parameters: [],
      tags: ['User'],
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
      summary: 'Change a user\'s avatar',
      description: '',
      parameters: [],
      tags: ['User'],
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
      summary: 'List a user\'s friends',
      description: '',
      parameters: [],
      tags: ['User'],
      responseBody: 'userLists',
      responseCodes: {
        200: metadataUtils.statusCodes['200'],
        410: metadataUtils.statusCodes['410'],
        500: metadataUtils.statusCodes['500'],
      },
    },
    POST: {
      controllers: ['inviteFriend'],
      summary: 'Invite a user\'s friend',
      description: '',
      parameters: [],
      tags: ['User'],
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
