'use strict';

var transformsUtils = {
  toString: transformsUtilsToString,
  mapIds: transformsUtilsMapIds,
};

module.exports = transformsUtils;

function transformsUtilsToString(id) {
  console.log('Something wieird here', (new Error()).stack);
  return id ? id.toString() : {}.undef; // Temp ugly fix
}

function transformsUtilsMapIds(fn, val) {
  if(val instanceof Array) {
    return val.map(transformsUtilsMapIds.bind(null, fn));
  }
  if('object' === typeof val && null !== val) {
    Object.keys(val).forEach(function(key) {
      if(key.length >= '_id'.length &&
        key.indexOf('_id') === key.length - '_id'.length) {
        val[key] = fn(val[key]);
        return;
      }
      if(key.length >= '_ids'.length &&
        key.indexOf('_ids') === key.length - '_ids'.length) {
        val[key] = val[key].map(fn);
        return;
      }
      val[key] = transformsUtilsMapIds(fn, val[key]);
    });
  }
  return val;
}
