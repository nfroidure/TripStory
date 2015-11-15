'use strict';

var eventsTransforms = {
  fromCollection: eventsTransformsFromCollection,
  toCollection: eventsTransformsToCollection,
};

module.exports = eventsTransforms;

function eventsTransformsFromCollection(src) {
  var dest = {
    _id: src._id,
    contents: src.event,
  };

  return dest;
}

function eventsTransformsToCollection(src) {
  var dest = {
    contents: src.contents,
  };

  return dest;
}

