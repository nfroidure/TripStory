(function() {
  'use strict';

  var DEFAULT_VALUES = {
    activated: false, // Wether the content were set once
    loading: true, // The content is currently loading
    reloading: true, // The content is currently loading and were loaded once before
    loaded: false, // The content were loaded succesfully
    failed: null, // Couldn't load the content
  };
  var LOAD_VALUES = {
    loading: true,
    // failed: dynamically computed
  };
  var SUCCESS_VALUES = {
    activated: true,
    loading: false,
    reloading: false,
    loaded: true,
    failed: false,
  };
  var FAIL_VALUES = {
    loading: false,
    reloading: false,
    loaded: false,
    // failed: dynamically get the error on fail
  };

  angular
    .module('app.utils')
    .service('loadService', LoadService);

    LoadService.$inject = [
      '$q', '$log',
    ];
    /* @ngInject */
    function LoadService($q, $log) {
      return {
        runState: runCustomState.bind(null, 'actions'),
        runCustomState: runCustomState,
        loadState: loadCustomState.bind(null, 'states'),
        loadCustomState: loadCustomState,
        wrapHTTPCall: wrapHTTPCall,
      };

      //
      function runCustomState(prop, scope, name, promise) {
        return _manageLoadWorkflow(promise, scope, prop, name);
      }
      function loadCustomState(prop, scope, promises) {
        var newPromises = {};

        // Manage scope indicators for all the resources
        _manageLoadWorkflow($q.all(promises), scope, prop, '_all');

        // Manage individual resources scope indicators
        Object.keys(promises).forEach(function(key) {
          newPromises[key] = _manageLoadWorkflow(promises[key], scope, prop, key);
        });

        return newPromises;
      }

      function _manageLoadWorkflow(promise, scope, prop, key) {
        // Set initial load state
        _softlySetKey(scope, prop, key, LOAD_VALUES, {
          reloading: scope[prop] && scope[prop][key] && scope[prop][key].activated,
        });
        // Handle success
        return promise.then(function(data) {
          _softlySetKey(scope, prop, key, SUCCESS_VALUES);
          return data;
        // Catch error and cast it
        }).catch(function(err) {
          if(!(err && err.code)) {
            err = new Error(FAIL_VALUES.failed);
            err.code = FAIL_VALUES.failed;
          }
          _softlySetKey(scope, prop, key, FAIL_VALUES, {
            failed: err,
          });
          throw err;
        });
      }

      function _softlySetKey(scope, prop, key/*, ...values*/) {
        // Ensure the prop is alright
        scope[prop] = scope[prop] || {};
        // Properly init the key if no set
        scope[prop][key] = scope[prop][key] || angular.copy(DEFAULT_VALUES);
        // Carefully apply values
        ([].slice.call(arguments, 3)).forEach(function(values) {
          Object.keys(values || {}).forEach(function(valueKey) {
            scope[prop][key][valueKey] = values[valueKey];
          });
        });
      }

      function wrapHTTPCall(promise, expectedStatus) {
        expectedStatus = expectedStatus || 200;
        return promise
        .catch(function(response) {
          var err;

          if(response.status !== expectedStatus) {
            if(0 >= response.status) {
              err = new Error('E_NETWORK');
              err.code = 'E_NETWORK';
              throw err;
            }
          }
          return response;
        })
        .then(function(response) {
          var err;

          if(response.status !== expectedStatus) {
            err = new Error(response.data.code || 'E_UNEXPECTED');
            err.code = response.data.code || 'E_UNEXPECTED';
            throw err;
          }

          return response;
        });
      }
    }

  }());
