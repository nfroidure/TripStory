'use strict';

var clone = require('clone');
var transformsUtils = require('../utils/transforms');

var carsTransforms = {
  fromCollection: carsTransformsFromCollection,
  toCollection: carsTransformsToCollection,
};

module.exports = carsTransforms;

function carsTransformsFromCollection(src) {
  var dest = {
    _id: src._id,
    contents: clone(src.contents),
  };

  dest.contents.user_id = src.user_id;
  delete dest.contents._id;
  return transformsUtils.fromCollection(dest);
}

function carsTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  return transformsUtils.toCollection(dest);
}
