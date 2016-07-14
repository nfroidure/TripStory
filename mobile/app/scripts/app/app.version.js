(function() {
  'use strict';

  angular
    .module('app')
    .factory('versionInterceptor', versionInterceptor)
    .factory('authInterceptor', authInterceptor)
    .config(httpVersion);

      authInterceptor.$inject = [
        '$injector',
      ];

      /* @ngInject */
      function authInterceptor($injector) {
        return { request: requestHandler };

        function requestHandler(config) {
          var token = $injector.get('authService').getToken();

          // Add token for Simplifield API url
          if(token) {
            config.headers = config.headers || {};
            config.headers.Authorization = 'Bearer ' + token;
          }

          return config;
        }
      }

      versionInterceptor.$inject = [
        '$q', '$injector',
      ];

      /* @ngInject */
      function versionInterceptor(
        $q, $injector
      ) {
        var factory = {
          responseError: responseError,
        };

        return factory;

          //
        function responseError(response) {
          var $state;

          if(412 === response.status) {
            $state = $injector.get('$state');
            console.log($state);
            $state.go('login');
          }
          return $q.reject(response);
        }
      }

      httpVersion.$inject = [
        '$httpProvider',
        'ENV',
      ];

      /* @ngInject */
      function httpVersion(
        $httpProvider,
        ENV
      ) {
        $httpProvider.interceptors.push('versionInterceptor');
        $httpProvider.interceptors.push('authInterceptor');
        $httpProvider.defaults.headers.common['X-Agent'] = ENV.agent;
      }

}());
