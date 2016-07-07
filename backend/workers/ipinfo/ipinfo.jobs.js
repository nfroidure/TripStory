'use strict';

const YError = require('yerror');
const Promise = require('bluebird');
const request = require('request');

const ipinfoJobs = {
  A_LOCAL_SIGNUP: ipinfoJob,
  A_LOCAL_LOGIN: ipinfoJob,
  A_FB_SIGNUP: ipinfoJob,
  A_FB_LOGIN: ipinfoJob,
  A_GG_SIGNUP: ipinfoJob,
  A_GG_LOGIN: ipinfoJob,
  A_TWITTER_SIGNUP: ipinfoJob,
  A_TWITTER_LOGIN: ipinfoJob,
  A_XEE_SIGNUP: ipinfoJob,
  A_XEE_LOGIN: ipinfoJob,
};

module.exports = ipinfoJobs;

function ipinfoJob(context, event) {
  return new Promise((resolve, reject) => {
    request('http://ipinfo.io/' + event.contents.ip, (err, res, body) => {
      if(err) {
        return reject(YError.wrap(err, 'E_IP_LOOKUP_FAILED'));
      }
      resolve(body);
    });
  })
  .then(JSON.parse)
  .then(data => context.db.collection('users').updateOne({
    _id: event.contents.user_id,
  }, {
    $set: {
      geo: data.loc ? data.loc.split(',') : [0, 0],
    },
  }));
}
