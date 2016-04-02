(function() {
  'use strict';

  angular
    .module('app.authentication')
    .factory('authService', AuthService);

  AuthService.$inject = ['$http', '$q', '$rootScope', 'ENV'];
  /* @ngInject */
  function AuthService($http, $q, $rootScope, ENV) {
    var profileDeffered = null;
    var service = {
      getProfile: getProfile,
      setProfile: setProfile,
      setAvatar: setAvatar,
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

      if(options.force || !profileDeffered) {
        profileDeffered = $q.defer()
        $http.get(ENV.apiEndpoint + '/api/v0/profile')
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
          $rootScope.$broadcast('profile:update');
          return profileDeffered.promise;
        });
      });
    }

    function setAvatar(file) {
      return getProfile().then(function(profile) {
        return $http.put(
          ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/avatar',
          file, {
            headers: {'Content-Type': undefined},
            transformRequest: angular.identity,
          }
        ).then(function(response) {
          var updatedProfilePromise;
          if(201 !== response.status) {
            throw response;
          }
          updatedProfilePromise = getProfile({
            force: true,
          });
          $rootScope.$broadcast('profile:update');
          return updatedProfilePromise;
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
        });
    }
  }

})();
