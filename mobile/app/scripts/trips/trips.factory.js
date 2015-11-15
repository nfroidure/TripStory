(function() {
  'use strict';

  angular
    .module('app.trips')
    .factory('tripsFactory', tripsFactory);

  tripsFactory.$inject = ['$http', 'createObjectId'];
  /* @ngInject */
  function tripsFactory($http, createObjectId) {
      var service = {
        get: get,
        post: post,
      };

      return service;
      ////////////////
      function get(id) {
        var url = 'http://localhost:3000/api/v0/trips';
        url += id ? '/' + id : '';
        return $http.get(url);
      }
      function post(trip) {
        return $http.post('http://localhost:3000/api/v0/trips/' + createObjectId(), trip);
      }
  }

})();
