'use strict';

var request = require('request');

var locationUtils = {
  getFormatedAddress: locationGetFormatedAddress,
};

module.exports = locationUtils;

function locationGetFormatedAddress(lat, lon, cb) {
  request.get(
    'http://maps.googleapis.com/maps/api/geocode/json?latlng=' +
    lat + ',' + lon,
    function(err, res, body) {
      if (err) {
        return cb(err);
      }

      try {
        body = JSON.parse(body);
      } catch(err) {
        return cb(err);
      }

      cb(null, body.results[0].formatted_address);
    }
  );
}
