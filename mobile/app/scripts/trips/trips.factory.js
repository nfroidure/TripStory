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
        post: post,
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
      function post(trip) {
        return $http.post(ENV.apiEndpoint + 'api/v0/trips/' + createObjectId(), trip);
      }
  }

})();
