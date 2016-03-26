'use strict';
console.log('API_ANALYTICS_KEY', process.env.API_ANALYTICS_KEY);
module.exports = {
  apiKey: process.env.API_ANALYTICS_KEY || '',
  enabled: !!process.env.API_ANALYTICS_KEY,
};
