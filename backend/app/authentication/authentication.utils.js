'use strict';

var bcrypt = require('bcrypt');

var authenticationUtils = {
  normalizeEmail: authenticationUtilsNormalizeEmail,
  createPasswordHash: authenticationUtilsCreatePasswordHash,
  comparePasswordToHash: authenticationUtilsComparePasswordToHash,
};

module.exports = authenticationUtils;

function authenticationUtilsNormalizeEmail(email) {
  return email.toLowerCase().trim();
}

function authenticationUtilsCreatePasswordHash(password) {
  return new Promise(function(resolve, reject) {
    bcrypt.genSalt(10, function genSaltHandler(err, salt) {
      if(err) {
        return reject(err);
      }
      bcrypt.hash(password, salt, function hashHandler(err2, hash) {
        if(err2) {
          return reject(err2);
        }
        resolve(hash);
      });
    });
  });
}

function authenticationUtilsComparePasswordToHash(password, hash) {
  return new Promise(function(resolve, reject) {
    bcrypt.compare(password, hash, function compareHandler(err, res) {
      if(err) {
        return reject(err);
      }
      resolve(res);
    });
  });
}
