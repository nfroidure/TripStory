(function() {
  'use strict';

  angular
    .module('app')
    .factory('versionInterceptor', versionInterceptor)
    .config(httpVersion);

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
        $httpProvider.defaults.headers.common['X-Agent'] = ENV.agent;
      }

}());
