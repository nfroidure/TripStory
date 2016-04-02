(function() {
  'use strict';

  angular
    .module('app.cars')
    .factory('carsFactory', carsFactory);

  carsFactory.$inject = [
    '$http', 'createObjectId', '$q', 'ENV', 'authService', 'analyticsService'
  ];
  /* @ngInject */
  function carsFactory(
    $http, createObjectId , $q, ENV, authService, analyticsService
  ) {
      var service = {
        list: list,
        get: get,
        remove: remove,
      };

      return service;
      ////////////////

      function list() {
        return authService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/cars';

          return $http.get(url).then(function(response) {
            if(200 !== response.status) {
              throw response;
            }
            return response;
          });
        });
      }

      function get(id) {
        return authService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/cars/' + id;

          return $http.get(url).then(function(response) {
            if(200 !== response.status) {
              throw response;
            }
            return response;
          });
        });
      }

      function remove(id) {
        return authService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/cars/' + id;

          return $http.delete(url).then(function(response) {
            throw response;
          }).catch(function(response) {
            if(410 !== response.status) {
              throw response;
            }
            analyticsService.trackEvent('cars', 'remove', profile._id);
            return response;
          });
        });
      }
  }

})();
