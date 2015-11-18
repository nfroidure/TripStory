(function() {
  'use strict';

  angular
    .module('app.utils')
    .factory('AuthService', AuthService);

  AuthService.$inject = ['$http', 'ENV', '$q'];
  /* @ngInject */
  function AuthService($http, ENV, $q) {
    var apiEndPoint = ENV.apiEndpoint;
    var profileDeffered = $q.defer();
    var service = {
      userIdPromise: profileDeffered.promise, // a corriger - empeche le reload
      log: log,
      signup: signup,
      logout: logout,
      getId: getId,
    }
    $http.get(apiEndPoint + 'api/v0/profile')
      .then(function(profile){
        console.log('profile', profile);
        profileDeffered.resolve(profile._id);
      });
    return service;

    ////////////////
    function log(credentials) {
      return $http.post(apiEndPoint + 'api/v0/login', credentials)
        .then(function(val){
          service.userIdPromise = $q.when(val.data._id);
          return val;
        });
    }

    function logout(credentials) {
      return $http.post(apiEndPoint + 'api/v0/logout', credentials);
    }

    function signup(credentials) {
      return $http.post(apiEndPoint + 'api/v0/signup', credentials);
    }

    function getId() {
      return service.userIdPromise
        .then(function(val) {return val});
    }
  }

})();
