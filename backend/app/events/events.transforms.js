'use strict';

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

  return dest;
}

function eventsTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  return dest;
}
