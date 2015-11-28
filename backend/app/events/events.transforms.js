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

  return transformsUtils.fromCollection(dest);
}

function eventsTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  dest.contents.date = new Date(dest.contents.date); // Remove this and use created.seal_date

  return transformsUtils.toCollection(dest);
}
