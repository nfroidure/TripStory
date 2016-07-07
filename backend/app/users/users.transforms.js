'use strict';

const transformsUtils = require('../utils/transforms');

const usersTransforms = {
  fromCollection: usersTransformsFromCollection,
  toCollection: usersTransformsToCollection,
};

module.exports = usersTransforms;

function usersTransformsFromCollection(src) {
  const dest = {
    _id: src._id,
    contents: src.contents,
  };

  if(src.avatar_url) {
    dest.avatar_url = src.avatar_url;
  }

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
  const dest = {
    contents: src.contents,
  };

  return transformsUtils.toCollection(dest);
}
