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
        return AuthService.userIdPromise.then(function(userId){
          var url = ENV.apiEndpoint + 'api/v0/users/' + userId + '/trips/' + idTrip;
          return $http.get(url);
        });
      }
      function list() {
        return AuthService.userIdPromise.then(function(userId){
          var url = ENV.apiEndpoint + 'api/v0/users/' + userId + '/trips';
          return $http.get(url);
        });
      }
      function put(trip) {
        return AuthService.userIdPromise.then(function(userId){
          return $http.put(ENV.apiEndpoint + 'api/v0/users/' + userId + '/trips/' + createObjectId(), trip);
        });
      }
  }

})();
