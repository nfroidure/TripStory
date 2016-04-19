(function() {
  'use strict';

  angular
    .module('app.trips')
    .factory('tripsFactory', tripsFactory);

  tripsFactory.$inject = [
    '$http', 'createObjectId', '$q',
    'ENV', 'authService', 'analyticsService', 'loadService',
  ];
  /* @ngInject */
  function tripsFactory(
    $http, createObjectId , $q,
    ENV, authService, analyticsService, loadService
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
            '/trips/' + createObjectId();

          return loadService.wrapHTTPCall($http.put(url, trip), 201)
          .then(function() {
            analyticsService.trackEvent('trips', 'add', profile._id);
          });
        });
      }

      function remove(tripId) {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/trips/' + tripId;

          return loadService.wrapHTTPCall($http.delete(url), 204)
          .then(function() {
            analyticsService.trackEvent('trips', 'delete', profile._id);
          });
        });
      }
  }

})();
