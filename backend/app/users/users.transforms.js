'use strict';

var transformsUtils = require('../utils/transforms');

var usersTransforms = {
  fromCollection: usersTransformsFromCollection,
  toCollection: usersTransformsToCollection,
};

module.exports = usersTransforms;

function usersTransformsFromCollection(src) {
  var dest = {
    _id: src._id,
    contents: src.contents,
  };

  if(src.auth) {
    Object.keys(src.auth).forEach(function(provider) {
      dest[provider] = {
        id: src.auth[provider].id,
      };
      if(src.auth[provider].username) {
        dest[provider].username = src.auth[provider].username;
      }
    });
  }

  return transformsUtils.fromCollection(dest);
}

function usersTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  return transformsUtils.toCollection(dest);
}
