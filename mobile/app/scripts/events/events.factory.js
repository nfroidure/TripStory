(function() {
  'use strict';

  angular
    .module('app.events')
    .factory('eventsFactory', eventsFactory);

  eventsFactory.$inject = ['$http', 'createObjectId', '$q', 'ENV', 'AuthService'];
  /* @ngInject */
  function eventsFactory($http, createObjectId , $q, ENV, AuthService) {
      var service = {
        get: get,
        list: list,
        put: put,
      };

      return service;
      ////////////////

      function get(idTrip) {
        return AuthService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/events/' + idTrip;
          return $http.get(url);
        });
      }

      function list() {
        return AuthService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/events';
          return $http.get(url);
        });
      }

      function put(event) {
        return AuthService.getProfile().then(function(profile){
          return $http.put(ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/events/' + createObjectId(), event);
        });
      }
  }

})();
