'use strict';

var transformsUtils = require('../utils/transforms');
var castToObjectId = require('mongodb').ObjectId;

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

  return transformsUtils.mapIds(transformsUtils.toString, dest);
}

function tripsTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  return transformsUtils.mapIds(castToObjectId, dest);
}
