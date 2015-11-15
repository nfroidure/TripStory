'use strict';

var tripsTransforms = {
  fromCollection: tripsTransformsFromCollection,
  toCollection: tripsTransformsToCollection,
};

module.exports = tripsTransforms;

function tripsTransformsFromCollection(src) {
  var dest = {
    _id: src._id,
    contents: src.trip,
  };

  return dest;
}

function tripsTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  return dest;
}
