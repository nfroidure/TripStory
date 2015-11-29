(function() {
  'use strict';

  angular
    .module('app.friends')
    .factory('friendsFactory', friendsFactory);

  friendsFactory.$inject = ['$http', 'createObjectId', '$q', 'ENV', 'AuthService'];
  /* @ngInject */
  function friendsFactory($http, createObjectId , $q, ENV, AuthService) {
      var service = {
        list: list,
      };

      return service;
      ////////////////

      function list() {
        return AuthService.getProfile().then(function(profile){
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/friends';
          return $http.get(url);
        });
      }
  }

})();
