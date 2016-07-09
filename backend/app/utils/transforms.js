'use strict';

const castToObjectId = require('mongodb').ObjectId;
const transformPerPrefixes = require('transform-per-suffixes');

const TO_SUFFIXES = [{
  value: '_id',
  transform: castToObjectId,
}, {
  value: '_ids',
  transform: transformsUtilsMapToOBjectIds,
}, {
  value: '_date',
  transform: transformsUtilsToDate,
}];

const FROM_SUFFIXES = [{
  value: '_id',
  transform: transformsUtilsToString,
}, {
  value: '_ids',
  transform: transformsUtilsToStrings,
}, {
  value: '_date',
  transform: transformsUtilsToISOString,
}];

const transformsUtils = {
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
