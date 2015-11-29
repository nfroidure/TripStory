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
        return AuthService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/cars';
          return $http.get(url);
        });
      }
  }

})();
