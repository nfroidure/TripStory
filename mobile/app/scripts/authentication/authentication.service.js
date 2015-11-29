(function() {
  'use strict';

  angular
    .module('app.authentication')
    .factory('AuthService', AuthService);

  AuthService.$inject = ['$http', 'ENV', '$q'];
  /* @ngInject */
  function AuthService($http, ENV, $q) {
    var profileDeffered = $q.defer();
    var service = {
      getProfile: getProfile,
      log: log,
      signup: signup,
      logout: logout,
    };
    $http.get(ENV.apiEndpoint + '/api/v0/profile')
      .then(function(res){
        profileDeffered.resolve(res.data);
      }).catch(profileDeffered.reject);
    return service;

    ////////////////

    function getProfile() {
      return profileDeffered.promise;
    }
    function log(credentials) {
      return $http.post(ENV.apiEndpoint + '/api/v0/login', credentials)
        .then(function(res){
          profileDeffered.promise = $q.when(res.data._id);
          return val;
        });
    }

    function logout(credentials) {
      return $http.post(ENV.apiEndpoint + '/api/v0/logout', credentials);
    }

    function signup(credentials) {
      return $http.post(ENV.apiEndpoint + '/api/v0/signup', credentials);
    }
  }

})();
