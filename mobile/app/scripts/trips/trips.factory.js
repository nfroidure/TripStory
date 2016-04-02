(function() {
  'use strict';

  angular
    .module('app.trips')
    .factory('tripsFactory', tripsFactory);

  tripsFactory.$inject = [
    '$http', 'createObjectId', '$q', 'ENV', 'authService', 'analyticsService'
  ];
  /* @ngInject */
  function tripsFactory(
    $http, createObjectId , $q, ENV, authService, analyticsService
  ) {
      var service = {
        get: get,
        list: list,
        put: put,
        remove: remove,
      };

      return service;
      ////////////////

      function get(idTrip) {
        return authService.getProfile().then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/trips/' + idTrip;

          return $http.get(url)
          .then(function(response) {
            if(200 !== response.status) {
              throw response;
            }
            return response;
          });
        });
      }

      function list() {
        return authService.getProfile().then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/trips';

          return $http.get(url)
          .then(function(response) {
            if(200 !== response.status) {
              throw response;
            }
            return response;
          });
        });
      }

      function put(trip) {
        return authService.getProfile().then(function(profile){
          return $http.put(ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/trips/' + createObjectId(), trip)
          .then(function(response) {
            if(201 !== response.status) {
              throw response;
            }
            analyticsService.trackEvent('trips', 'add', profile._id);
            return response;
          });
        });
      }

      function remove(tripId) {
        return authService.getProfile().then(function(profile){
          return $http.delete(ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/trips/' + tripId)
          .then(function(response) {
            if(204 !== response.status) {
              throw response;
            }
            analyticsService.trackEvent('trips', 'delete', profile._id);
            return response;
          });
        });
      }
  }

})();
