(function() {
  'use strict';

  angular
    .module('app.events')
    .factory('eventsFactory', eventsFactory);

  eventsFactory.$inject = [
    '$http', '$q',
    'ENV', 'createObjectId', 'authService', 'loadService',
  ];
  /* @ngInject */
  function eventsFactory(
    $http, $q,
    ENV, createObjectId, authService, loadService
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

          return loadService.wrapHTTPCall($http.get(url), 200);
        });
      }

      function get(id) {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/events/' + id;

          return loadService.wrapHTTPCall($http.get(url), 200);
        });
      }

      function put(event) {
        return authService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/events/' + event._id;

          event._id = event._id || createObjectId();
          return loadService.wrapHTTPCall($http.put(url, event), 201);
        });
      }
  }

})();
