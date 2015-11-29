(function() {
  'use strict';

  angular
    .module('app.utils')
    .factory('userService', userService);

  userService.$inject = ['$http', 'ENV', 'AuthService'];
  /* @ngInject */
  function userService($http, ENV, AuthService) {
    var userId = '';
    var service = {
      getUser: getUser,
    }
    return service;

    ////////////////
    function getUser(userId) {
      return AuthService.userIdPromise.then(function(userId){
        var url = ENV.apiEndpoint + '/api/v0/users/' + userId;
        return $http.get(url);
      });
    }
  }

}());
