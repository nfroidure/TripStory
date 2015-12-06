'use strict';

var castToObjectId = require('mongodb').ObjectId;
var transformPerPrefixes = require('transform-per-suffixes');

var TO_SUFFIXES = [{
  value: '_id',
  transform: castToObjectId,
}, {
  value: '_ids',
  transform: transformsUtilsMapToOBjectIds,
}, {
  value: '_date',
  transform: transformsUtilsToDate,
}];

var FROM_SUFFIXES = [{
  value: '_id',
  transform: transformsUtilsToString,
}, {
  value: '_ids',
  transform: transformsUtilsToStrings,
}, {
  value: '_date',
  transform: transformsUtilsToISOString,
}];

var transformsUtils = {
  fromCollection: transformPerPrefixes.bind(null, FROM_SUFFIXES),
  toCollection: transformPerPrefixes.bind(null, TO_SUFFIXES),
};

module.exports = transformsUtils;

function transformsUtilsMapToOBjectIds(ids) {
  return ids.map(castToObjectId);
}

function transformsUtilsToString(id) {
  return id.toString();
}

function transformsUtilsToStrings(ids) {
  return ids.map(transformsUtilsToString);
}

function transformsUtilsToISOString(date) {
  return date.toISOString();
}
function transformsUtilsToDate(isoStringDate) {
  return new Date(isoStringDate);
}
