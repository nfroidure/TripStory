(function() {
  'use strict';

  angular
    .module('app.events')
    .factory('eventsFactory', eventsFactory);

  eventsFactory.$inject = ['$http', 'createObjectId', '$q', 'ENV', 'authService'];
  /* @ngInject */
  function eventsFactory($http, createObjectId , $q, ENV, authService) {
      var service = {
        get: get,
        list: list,
        put: put,
      };

      return service;
      ////////////////

      function get(idTrip) {
        return authService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/events/' + idTrip;
          return $http.get(url);
        })
        .then(function(response) {
          if(200 !== response.status) {
            throw response;
          }
          return response;
        });
      }

      function list() {
        return authService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/events';
          return $http.get(url);
        })
        .then(function(response) {
          if(200 !== response.status) {
            throw response;
          }
          return response;
        });
      }

      function put(event) {
        return authService.getProfile().then(function(profile){
          event._id = event._id || createObjectId();
          return $http.put(ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/events/' + event._id, event);
        })
        .then(function(response) {
          if(201 !== response.status) {
            throw response;
          }
          return response;
        });
      }
  }

})();
