(function() {
  'use strict';

  angular
    .module('app.authentication')
    .factory('authService', AuthService);

  AuthService.$inject = [
    '$http', '$q', '$rootScope',
    'ENV', 'analyticsService', 'sfLoadService',
  ];
  /* @ngInject */
  function AuthService(
    $http, $q, $rootScope,
    ENV, analyticsService, sfLoadService
  ) {
    var profileDeffered = null;
    var service = {
      getProfile: getProfile,
      setProfile: setProfile,
      setAvatar: setAvatar,
      deleteProfile: deleteProfile,
      login: login,
      signup: signup,
      logout: logout,
    };

    service.getProfile().then(function(profile) {
        analyticsService.trackEvent('auth', 'session', profile._id);
    }).catch(function(err) {
        analyticsService.trackEvent('auth', 'session', 'none');
    });

    return service;

    ////////////////

    function getProfile(options) {
      var url;

      options = options || {};

      if(options.force || !profileDeffered) {
        profileDeffered = $q.defer()
        url = ENV.apiEndpoint + '/api/v0/profile';

        sfLoadService.wrapHTTPCall($http.get(url), 200)
        .then(function(response) {
          profileDeffered.resolve(response.data);
          return profileDeffered.promise;
        }).catch(profileDeffered.reject);
      }

      return profileDeffered.promise;
    }

    function setProfile(profile) {
      return getProfile().then(function(profile) {
        var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id;

        return sfLoadService.wrapHTTPCall(
          $http.put(url, profile), 201
        ).then(function(response) {
          profileDeffered = $q.defer();
          profileDeffered.resolve(response.data);
          $rootScope.$broadcast('profile:update');
          analyticsService.trackEvent('auth', 'update', profile._id);
          return profileDeffered.promise;
        });
      });
    }

    function setAvatar(file) {
      return getProfile().then(function(profile) {
        var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id + '/avatar';

        return sfLoadService.wrapHTTPCall(
          $http.put(
            url,
            file, {
              headers: {'Content-Type': undefined},
              transformRequest: angular.identity,
            }
          ), 201
        ).then(function(response) {
          var updatedProfilePromise = getProfile({
            force: true,
          });
          $rootScope.$broadcast('profile:update');
          analyticsService.trackEvent('auth', 'avatar', profile._id);
          return updatedProfilePromise;
        });
      });
    }

    function deleteProfile(profile) {
      return getProfile().then(function(profile) {
        var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id;
        return sfLoadService.wrapHTTPCall(
          $http.delete(url), 410
        ).then(function(response) {
          analyticsService.trackEvent('auth', 'signout', profile._id);
          return response;
        });
      })
      .then(function() {
        profileDeffered = $q.defer();
        profileDeffered.reject();
      });
    }

    function login(credentials) {
      var url = ENV.apiEndpoint + '/api/v0/login';

      return sfLoadService.wrapHTTPCall(
        $http.post(url, credentials), 200
      )
      .then(function(response) {
        profileDeffered = $q.defer();
        analyticsService.trackEvent('auth', 'login', response.data._id);
        profileDeffered.resolve(response.data);
      });
    }

    function logout() {
      return getProfile().then(function(profile) {
        var url = ENV.apiEndpoint + '/api/v0/logout';

        return sfLoadService.wrapHTTPCall(
          $http.post(url), 204
        ).then(function(response) {
          analyticsService.trackEvent('auth', 'logout', profile._id);
          profileDeffered = $q.defer();
          profileDeffered.reject();
        });
      });
    }

    function signup(credentials) {
      var url = ENV.apiEndpoint + '/api/v0/signup';

      return sfLoadService.wrapHTTPCall(
        $http.post(url, credentials), 201
      )
      .then(function(response) {
        profileDeffered = $q.defer();
        profileDeffered.resolve(response.data);
        analyticsService.trackEvent('auth', 'signup', response.data._id);
      });
    }
  }

})();
