(function() {
  'use strict';

  angular
    .module('app.trips')
    .factory('tripsFactory', tripsFactory);

  tripsFactory.$inject = ['$http', 'createObjectId', '$q', 'ENV', 'AuthService'];
  /* @ngInject */
  function tripsFactory($http, createObjectId , $q, ENV, AuthService) {
      var service = {
        get: get,
        list: list,
        put: put,
      };

      return service;
      ////////////////

      function get(idTrip) {
        return AuthService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/trips/' + idTrip;
          return $http.get(url);
        });
      }
      function list() {
        return AuthService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/trips';
          return $http.get(url);
        });
      }
      function put(trip) {
        return AuthService.getProfile().then(function(profile){
          return $http.put(ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/trips/' + createObjectId(), trip);
        });
      }
  }

})();
