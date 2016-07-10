(function() {
  'use strict';

  // We're relying on the server OAuth implementation
  // in order to keep track of connections and to
  // keep access/refesh tokens after logout usin the
  // in app browser
  // https://github.com/apache/cordova-plugin-inappbrowser

  var OAUTH_PATH = '/auth/';
  var OAUTH_CB = '/callback';

  angular
    .module('app.utils')
    .service('oAuthService', OAuthService);

    OAuthService.$inject = [
      '$q', '$window', '$location', '$log',
      'ENV',
    ];
    /* @ngInject */
    function OAuthService(
      $q, $window, $location, $log,
      ENV
    ) {
      return {
        run: 'browser' === ENV.name ?
          runBrowser :
          runNative,
      };

      //
      function runBrowser(type) {
        $location.url(buildEndpoint(type));
      }
      function runNative(type) {
        var deferred = $q.defer();
        var oauthWindow = $window.open(buildEndpoint(type));

        oauthWindow.addEventListener('loaderror', function onLoadError() {
          oauthWindow.close();
          deferred.reject(new Error('OAUTH_LOAD_ERROR'));
        });
        oauthWindow.addEventListener('loadstart', function onLoadStart(event) {
          $log('oauth', 'Loading url: ' + event.url);
          if((event.url).startsWith(buildCallback(type))) {
            var accesToken = (event.url).split("code=")[1];
            oauthWindow.close();
            deferred.resolve(new Error('OAUTH_LOAD_ERROR'));
          }
        });
        oauthWindow.addEventListener('exit', function onExit() {
          oauthWindow.close();
          deferred.reject(new Error('OAUTH_LOAD_ERROR'));
        });

        return deferred.promise;
      }
      function buildEndpoint(type) {
        return ENV.apiEndpoint + OAUTH_PATH + type;
      }
      function buildCallback(type) {
        return buildEndpoint(type) + OAUTH_CB;
      }
    }

  }());
