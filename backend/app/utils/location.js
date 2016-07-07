'use strict';

var request = require('request');
var Promise = require('bluebird');

var locationUtils = {
  getFormatedAddress: locationGetFormatedAddress,
};

module.exports = locationUtils;

function locationGetFormatedAddress(lat, lng) {
  return new Promise(function(resolve, reject) {
    request.get(
    'http://maps.googleapis.com/maps/api/geocode/json?latlng=' +
    lat + ',' + lng,
    function(err, res, body) {
      if(err) {
        return reject(err);
      }

      try {
        body = JSON.parse(body);
      } catch (err2) {
        return reject(err2);
      }

      resolve(body.results[0].formatted_address);
    });
  });
}
