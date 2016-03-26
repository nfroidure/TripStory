'use strict';

module.exports = {
  apiKey: process.env.API_ANALYTICS_KEY || '',
  enabled: !!process.env.API_ANALYTICS_KEY,
};
