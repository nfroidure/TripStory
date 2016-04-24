(function() {
  'use strict';

  angular
    .module('app.cars')
    .factory('carsFactory', carsFactory);

  carsFactory.$inject = [
    '$http', '$q',
    'ENV', 'createObjectId', 'authService', 'loadService', 'analyticsService',
  ];
  /* @ngInject */
  function carsFactory(
    $http, $q,
    ENV, createObjectId, authService, loadService, analyticsService
  ) {
      var service = {
        list: list,
        get: get,
        remove: remove,
      };

      return service;
      ////////////////

      function list() {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/cars';


          return loadService.wrapHTTPCall($http.get(url), 200);
        });
      }

      function get(id) {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/cars/' + id;

          return loadService.wrapHTTPCall($http.get(url), 200);
        });
      }

      function remove(id) {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/cars/' + id;

          return loadService.wrapHTTPCall($http.delete(url), 410)
          .then(function(response) {
            analyticsService.trackEvent('cars', 'remove', profile._id);
            return response;
          });
        });
      }
  }

})();
