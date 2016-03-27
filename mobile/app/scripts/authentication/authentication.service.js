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
      log: login,
      signup: signup,
      logout: logout,
    };

    service.getProfile();

    return service;

    ////////////////

    function getProfile(options) {
      options = options || {};

      if(options.force) {
        return $http.get(ENV.apiEndpoint + '/api/v0/profile')
        .then(function(response) {
          if(200 !== response.status) {
            throw response;
          }
          profileDeffered.resolve(response.data);
          return profileDeffered.promise;
        }).catch(profileDeffered.reject);
      }

      return profileDeffered.promise;
    }

    function setProfile(profile) {
      return getProfile().then(function(profile) {
        return $http.put(
          ENV.apiEndpoint + '/api/v0/users/' + profile._id,
          profile
        ).then(function(response) {
          if(201 !== response.status) {
            throw response;
          }
          profileDeffered = $q.defer();
          profileDeffered.resolve(response.data);
          return profileDeffered.promise;
        });
      });
    }

    function deleteProfile(profile) {
      return getProfile().then(function(profile) {
        return $http.delete(
          ENV.apiEndpoint + '/api/v0/users/' + profile._id
        )
        .then(function(response) {
          throw response;
        })
        .catch(function(response) {
          if(410 !== response.status) {
            throw response;
          }
          return response;
        })
        .then(function() {
          profileDeffered = $q.defer();
          profileDeffered.reject();
        });
      });
    }

    function login(credentials) {
      return $http.post(ENV.apiEndpoint + '/api/v0/login', credentials)
        .then(function(res) {
          if(200 !== res.status) {
            throw res;
          }
          profileDeffered = $q.defer();
          profileDeffered.resolve(res.data);
        });
    }

    function logout() {
      return $http.post(ENV.apiEndpoint + '/api/v0/logout')
        .then(function(response) {
          if(204 !== response.status) {
            throw response;
          }
          profileDeffered = $q.defer();
          profileDeffered.reject();
        });
    }

    function signup(credentials) {
      return $http.post(ENV.apiEndpoint + '/api/v0/signup', credentials)
        .then(function(res) {
          if(201 !== res.status) {
            throw res;
          }
          profileDeffered = $q.defer();
          profileDeffered.resolve(res.data);
        });;
    }
  }

})();
