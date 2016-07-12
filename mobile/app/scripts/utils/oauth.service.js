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
      '$q', '$window', '$log',
      'ENV',
    ];
    /* @ngInject */
    function OAuthService(
      $q, $window, $log,
      ENV
    ) {
      return {
        run: 'browser' === ENV.context ?
          runBrowser :
          runNative,
      };

      //
      function runBrowser(type) {
        var url = buildEndpoint(type);

        $log.debug('Browsing url: ' + url);
        $window.location.href = url;
        return $q.defer().promise;
      }
      function runNative(type) {
        var deferred = $q.defer();
        var url = buildEndpoint(type);
        var oauthWindow = $window.open(
          url,
          '_blank',
          'location=no,clearsessioncache=yes,clearcache=yes'
        );

        $log.debug('Opening url: ' + url);

        oauthWindow.addEventListener('loaderror', function onLoadError(event) {
          $log.debug('OAuth error.', event.code, event.message);
          oauthWindow.close();
          deferred.reject(new Error('OAUTH_LOAD_ERROR'));
        });
        oauthWindow.addEventListener('loadstart', function onLoadStart(event) {
          $log.debug('OAuth url: ' + event.url);
          if((event.url).startsWith(buildCallback(type))) {
            var accesToken = (event.url).split("code=")[1];
            oauthWindow.close();
            deferred.resolve(new Error('OAUTH_LOAD_ERROR'));
          }
        });
        oauthWindow.addEventListener('exit', function onExit() {
          $log.debug('OAuth exit.');
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
