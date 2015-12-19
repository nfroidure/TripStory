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
    created_date: src.created.seal_date,
  };

  return transformsUtils.fromCollection(dest);
}

function eventsTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  return transformsUtils.toCollection(dest);
}
