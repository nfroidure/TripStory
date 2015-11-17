(function() {
  'use strict';

  angular
    .module('app.trips')
    .factory('tripsFactory', tripsFactory);

  tripsFactory.$inject = ['$http', 'createObjectId', 'ProfileResource', '$q'];
  /* @ngInject */
  function tripsFactory($http, createObjectId, ProfileResource, $q) {

      var service = {
        get: get,
        post: post,
      };

      return service;
      ////////////////

      function get() {
        ProfileResource.get().$promise
          .then(function(val){
            var url = 'http://stripstory.lol/api/v0/users/' + val._id + '/trips';
            return $http.get(url);
          });
      }
      function post(trip) {
        return $http.post('https://stripstory.lol/api/v0/trips/' + createObjectId(), trip);
      }
  }

})();
