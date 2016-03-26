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
      setProfile: setProfile,
      deleteProfile: deleteProfile,
      log: log,
      signup: signup,
      logout: logout,
    };
    $http.get(ENV.apiEndpoint + '/api/v0/profile')
      .then(function(res) {
        profileDeffered.resolve(res.data);
      }).catch(profileDeffered.reject);
    return service;

    ////////////////

    function getProfile() {
      return profileDeffered.promise;
    }
    function setProfile(profile) {
      return getProfile().then(function(profile) {
        return $http.put(
          ENV.apiEndpoint + '/api/v0/users/' + profile._id,
          profile
        ).then(function(res) {
          profileDeffered = $q.defer();
          profileDeffered.resolve(res.data);
        });
      });
    }
    function deleteProfile(profile) {
      return getProfile().then(function(profile) {
        return $http.delete(
          ENV.apiEndpoint + '/api/v0/users/' + profile._id
        ).then(function(res) {
          profileDeffered = $q.defer();
          profileDeffered.reject();
        });
      });
    }
    function log(credentials) {
      return $http.post(ENV.apiEndpoint + '/api/v0/login', credentials)
        .then(function(res){
          profileDeffered.promise = $q.when(res.data);
          return profileDeffered.promise;
        });
    }

    function logout() {
      return $http.post(ENV.apiEndpoint + '/api/v0/logout')
        .then(function() {
          profileDeffered = $q.defer();
          profileDeffered.reject();
        });
    }

    function signup(credentials) {
      return $http.post(ENV.apiEndpoint + '/api/v0/signup', credentials);
    }
  }

})();
