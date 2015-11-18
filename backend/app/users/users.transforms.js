'use strict';

var transformsUtils = require('../utils/transforms');
var castToObjectId = require('mongodb').ObjectId;

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

  return transformsUtils.mapIds(transformsUtils.toString, dest);
}

function usersTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  return transformsUtils.mapIds(castToObjectId, dest);
}
