'use strict';

var transformsUtils = require('../utils/transforms');

var tripsTransforms = {
  fromCollection: tripsTransformsFromCollection,
  toCollection: tripsTransformsToCollection,
};

module.exports = tripsTransforms;

function tripsTransformsFromCollection(src) {
  var dest = {
    _id: src._id,
    contents: src.contents,
  };

  dest.created_date = src.created.seal_date;
  if(src.modified && src.modified.length) {
    dest.modified_date = src.modified[0].seal_date;
  }
  if(src.ended) {
    dest.ended_date = src.ended.seal_date;
  }

  return transformsUtils.fromCollection(dest);
}

function tripsTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  return transformsUtils.toCollection(dest);
}
