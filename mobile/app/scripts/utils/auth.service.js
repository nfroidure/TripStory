(function() {
  'use strict';

  angular
    .module('app.utils')
    .factory('AuthService', AuthService);

  AuthService.$inject = ['$http', 'ENV', '$q'];
  /* @ngInject */
  function AuthService($http, ENV, $q) {
    var profileDeffered = $q.defer();
    var service = {
      userIdPromise: profileDeffered.promise,
      log: log,
      signup: signup,
      logout: logout,
      getId: getId,
    };
    $http.get(ENV.apiEndpoint + '/api/v0/profile')
      .then(function(res){
        profileDeffered.resolve(res.data._id);
      });
    return service;

    ////////////////
    function log(credentials) {
      return $http.post(ENV.apiEndpoint + '/api/v0/login', credentials)
        .then(function(res){
          service.userIdPromise = $q.when(res.data._id);
          return val;
        });
    }

    function logout(credentials) {
      return $http.post(ENV.apiEndpoint + '/api/v0/logout', credentials);
    }

    function signup(credentials) {
      return $http.post(ENV.apiEndpoint + '/api/v0/signup', credentials);
    }

    function getId() {
      return service.userIdPromise
        .then(function(userId) {
          return userId;
        });
    }
  }

})();
