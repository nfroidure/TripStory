(function() {
  'use strict';

  angular
    .module('app.cars')
    .factory('carsFactory', carsFactory);

  carsFactory.$inject = ['$http', 'createObjectId', '$q', 'ENV', 'AuthService'];
  /* @ngInject */
  function carsFactory($http, createObjectId , $q, ENV, AuthService) {
      var service = {
        list: list,
      };

      return service;
      ////////////////

      function list() {
        return AuthService.userIdPromise.then(function(userId){
          var url = ENV.apiEndpoint + 'api/v0/users/' + userId + '/cars';
          return $http.get(url);
        });
      }
  }

})();
