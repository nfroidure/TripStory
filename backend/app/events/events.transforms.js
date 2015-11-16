'use strict';

var transformsUtils = require('../utils/transforms');

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

  return dest;
}
