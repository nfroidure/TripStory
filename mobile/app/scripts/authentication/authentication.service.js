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
    var profileDeferred = null;
    var _token = '';
    var service = {
      setToken: setToken,
      getToken: getToken,
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

    function setToken(token) {
      _token = token;
    }

    function getToken() {
      return _token;
    }

    function getProfile(options) {
      var url;

      options = options || {};

      if(options.force || !profileDeferred) {
        profileDeferred = $q.defer()
        url = ENV.apiEndpoint + '/api/v0/profile';

        sfLoadService.wrapHTTPCall($http.get(url), 200)
        .then(function(response) {
          profileDeferred.resolve(response.data);
          return profileDeferred.promise;
        }).catch(function(err) {
          var deferred = profileDeferred;

          profileDeferred = null;
          deferred.reject(err);
        });
      }

      return profileDeferred.promise;
    }

    function setProfile(profile) {
      return getProfile().then(function(profile) {
        var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id;

        return sfLoadService.wrapHTTPCall(
          $http.put(url, profile), 201
        ).then(function(response) {
          profileDeferred = $q.defer();
          profileDeferred.resolve(response.data);
          $rootScope.$broadcast('profile:update');
          analyticsService.trackEvent('auth', 'update', profile._id);
          return profileDeferred.promise;
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
        profileDeferred = $q.defer();
        profileDeferred.reject();
      });
    }

    function login(credentials) {
      var url = ENV.apiEndpoint + '/api/v0/login';

      return sfLoadService.wrapHTTPCall(
        $http.post(url, credentials), 200
      )
      .then(function(response) {
        profileDeferred = $q.defer();
        analyticsService.trackEvent('auth', 'login', response.data._id);
        profileDeferred.resolve(response.data);
      });
    }

    function logout() {
      return getProfile().then(function(profile) {
        var url = ENV.apiEndpoint + '/api/v0/logout';

        return sfLoadService.wrapHTTPCall(
          $http.post(url), 204
        ).then(function(response) {
          analyticsService.trackEvent('auth', 'logout', profile._id);
          profileDeferred = null;
          _token = '';
        });
      });
    }

    function signup(credentials) {
      var url = ENV.apiEndpoint + '/api/v0/signup';

      return sfLoadService.wrapHTTPCall(
        $http.post(url, credentials), 201
      )
      .then(function(response) {
        profileDeferred = $q.defer();
        profileDeferred.resolve(response.data);
        analyticsService.trackEvent('auth', 'signup', response.data._id);
      });
    }
  }

})();
