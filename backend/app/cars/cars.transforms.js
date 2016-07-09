'use strict';

const clone = require('clone');
const transformsUtils = require('../utils/transforms');

const carsTransforms = {
  fromCollection: carsTransformsFromCollection,
  toCollection: carsTransformsToCollection,
};

module.exports = carsTransforms;

function carsTransformsFromCollection(src) {
  const dest = {
    _id: src._id,
    contents: clone(src.contents),
  };

  dest.contents.user_id = src.user_id;
  delete dest.contents._id;
  return transformsUtils.fromCollection(dest);
}

function carsTransformsToCollection(src) {
  const dest = {
    contents: src.contents,
  };

  return transformsUtils.toCollection(dest);
}
