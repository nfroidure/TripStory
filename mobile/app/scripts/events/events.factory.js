(function() {
  'use strict';

  angular
    .module('app.events')
    .factory('eventsFactory', eventsFactory);

  eventsFactory.$inject = [
    '$http', '$q',
    'ENV', 'createObjectId', 'authService', 'sfLoadService',
  ];
  /* @ngInject */
  function eventsFactory(
    $http, $q,
    ENV, createObjectId, authService, sfLoadService
  ) {
      var service = {
        list: list,
        get: get,
        put: put,
      };

      return service;
      ////////////////

      function list() {
        return authService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/events';

          return sfLoadService.wrapHTTPCall($http.get(url), 200);
        });
      }

      function get(id) {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/events/' + id;

          return sfLoadService.wrapHTTPCall($http.get(url), 200);
        });
      }

      function put(event) {
        return authService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/events/' + event._id;

          return sfLoadService.wrapHTTPCall($http.put(url, event), 201);
        });
      }
  }

})();
