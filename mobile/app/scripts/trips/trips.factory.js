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
        var debug = 'abbacacaabbacacaabbacaca';
        return $http.get('localhost:3000/api/v0/trips/' + id || debug)
          .then(function(values){
            console.log(values);
          });
      }
      function post(trip) {
        return $http.post('localhost:3000/api/v0/trips/' + createObjectId(), trip)
      }
  }

})();
