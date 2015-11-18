'use strict';

var transformsUtils = require('../utils/transforms');
var castToObjectId = require('mongodb').ObjectId;

var eventsTransforms = {
  fromCollection: eventsTransformsFromCollection,
  toCollection: eventsTransformsToCollection,
};

module.exports = eventsTransforms;

function eventsTransformsFromCollection(src) {
  var dest = {
    _id: src._id,
    contents: src.contents,
  };

  return transformsUtils.mapIds(transformsUtils.toString, dest);
}

function eventsTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  dest.contents.date = new Date(dest.contents.date);

  return transformsUtils.mapIds(castToObjectId, dest);
}
