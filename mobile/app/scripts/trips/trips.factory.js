(function() {
  'use strict';

  angular
    .module('app.trips')
    .factory('tripsFactory', tripsFactory);

  tripsFactory.$inject = [
    '$http', '$q',
    'ENV', 'createObjectId', 'authService', 'analyticsService', 'loadService',
  ];
  /* @ngInject */
  function tripsFactory(
    $http, $q,
    ENV, createObjectId, authService, analyticsService, loadService
  ) {
      var service = {
        list: list,
        get: get,
        put: put,
        remove: remove,
      };

      return service;
      ////////////////

      function list() {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/trips';

          return loadService.wrapHTTPCall($http.get(url), 200);
        });
      }

      function get(id) {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/trips/' + id;

          return loadService.wrapHTTPCall($http.get(url), 200);
        });
      }

      function put(trip) {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/trips/' + trip._id;

          return loadService.wrapHTTPCall($http.put(url, trip), 201)
          .then(function(response) {
            analyticsService.trackEvent('trips', 'add', profile._id);
            return response;
          });
        });
      }

      function remove(tripId) {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/trips/' + tripId;

          return loadService.wrapHTTPCall($http.delete(url), 410)
          .then(function(response) {
            analyticsService.trackEvent('trips', 'delete', profile._id);
            return response;
          });
        });
      }
  }

})();
