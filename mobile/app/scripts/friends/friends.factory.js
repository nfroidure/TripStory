(function() {
  'use strict';

  angular
    .module('app.friends')
    .factory('friendsFactory', friendsFactory);

  friendsFactory.$inject = ['$http', 'createObjectId', '$q', 'ENV', 'authService'];
  /* @ngInject */
  function friendsFactory($http, createObjectId , $q, ENV, authService) {
      var service = {
        list: list,
        invite: invite,
      };

      return service;
      ////////////////

      function list() {
        return authService.getProfile().then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/friends';
          return $http.get(url);
        }).then(function(response) {
          if(200 !== response.status) {
            throw response;
          }
          return response;
        });
      }

      function invite(data) {
        return authService.getProfile().then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/friends';
          return $http.post(url, data);
        }).then(function(response) {
          if(204 !== response.status) {
            throw response;
          }
          return response;
        });
      }
  }

})();
