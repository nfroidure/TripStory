'use strict';

const metadataUtils = require('../utils/metadata');
const usersSchema = require('./users.schema');

const usersMetadata = {
  [metadataUtils.apiPrefix + 'users']: {
    GET: {
      controllers: ['list'],
      summary: 'List all users',
      description: '',
      parameters: [],
      tags: ['User'],
      successResponses: {
        200: {
          type: 'collection',
          schema: usersSchema,
        },
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
  [metadataUtils.apiPrefix + 'users/:user_id']: {
    GET: {
      controllers: ['get'],
      summary: 'Retrieve a user',
      description: '',
      parameters: [],
      tags: ['User'],
      successResponses: {
        200: {
          type: 'entry',
          schema: usersSchema,
        },
      },
      errorResponses: {
        410: {
          codes: ['E_NOT_FOUND'],
          description: 'No user with the given id.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
    PUT: {
      controllers: ['put'],
      summary: 'Create/edit a user',
      description: '',
      parameters: [],
      tags: ['User'],
      successResponses: {
        201: {
          type: 'entry',
          schema: usersSchema,
        },
      },
      errorResponses: {
        400: {
          codes: ['E_NOT_FOUND'],
          description: 'No user with the given id.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
    DELETE: {
      controllers: ['delete'],
      summary: 'Remove a user',
      description: '',
      parameters: [],
      tags: ['User'],
      successResponses: {
        410: {
          description: 'The user does not exist.',
        },
      },
      errorResponses: {
        400: {
          codes: ['E_NOT_FOUND'],
          description: 'No user with the given id.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
  [metadataUtils.apiPrefix + 'users/:user_id/avatar']: {
    PUT: {
      controllers: ['putAvatar'],
      summary: 'Change a user\'s avatar',
      description: '',
      parameters: [],
      tags: ['User'],
      successResponses: {
        201: {
          type: 'entry',
          schema: usersSchema,
        },
      },
      errorResponses: {
        410: {
          codes: ['E_NOT_FOUND'],
          description: 'No user with the given id.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
  [metadataUtils.apiPrefix + 'users/:user_id/friends']: {
    GET: {
      controllers: ['listFriends'],
      summary: 'List a user\'s friends',
      description: '',
      parameters: [],
      tags: ['User'],
      successResponses: {
        200: {
          type: 'collection',
          schema: usersSchema,
        },
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
    POST: {
      controllers: ['inviteFriend'],
      summary: 'Invite a user\'s friend',
      description: '',
      parameters: [],
      tags: ['User'],
      successResponses: {
        200: {
          type: 'empty',
        },
        201: {
          type: 'entry',
          schema: usersSchema,
        },
      },
      errorResponses: {
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
};

module.exports = usersMetadata;
