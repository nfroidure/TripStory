'use strict';

const transformsUtils = require('../utils/transforms');

const eventsTransforms = {
  fromCollection: eventsTransformsFromCollection,
  toCollection: eventsTransformsToCollection,
};

module.exports = eventsTransforms;

function eventsTransformsFromCollection(src) {
  const dest = {
    _id: src._id,
    contents: src.contents,
    created_date: src.created.seal_date,
  };

  return transformsUtils.fromCollection(dest);
}

function eventsTransformsToCollection(src) {
  const dest = {
    contents: src.contents,
  };

  return transformsUtils.toCollection(dest);
}
