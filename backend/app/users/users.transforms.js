'use strict';

var usersTransforms = {
  fromCollection: usersTransformsFromCollection,
  toCollection: usersTransformsToCollection,
};

module.exports = usersTransforms;

function usersTransformsFromCollection(src) {
  var dest = {
    contents: src.contents,
  };

  return dest;
}

function usersTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  return dest;
}
