'use strict';

const eventsSchema = require('../events/events.schema');

const systemsMetadata = {
  '/ping': {
    GET: {
      controllers: ['ping'],
      summary: 'Ping',
      description: '',
      parameters: [],
      tags: ['System'],
      successResponses: {
        200: {
          type: 'raw',
          schema: {
            type: 'object',
            required: 'pong',
            properties: {
              pong: {
                type: 'string',
                enum: ['pong'],
              },
            },
          },
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
  '/bus': {
    POST: {
      controllers: ['triggerEvent'],
      summary: 'Trigger an event in the bus',
      description: '',
      parameters: [
        {
          name: 'body',
          in: 'body',
        }
      ],
      tags: ['System', 'Events'],
      successResponses: {
        201: {
          type: 'entry',
          schema: eventsSchema,
        },
      },
      errorResponses: {
        400: {
          codes: ['E_BAD_CONTENT'],
          description: 'Bad event provided.',
        },
        500: {
          codes: ['E_UNEXPECTED'],
          description: 'When shit hit the fan.',
        },
      },
    },
  },
};

module.exports = systemsMetadata;
