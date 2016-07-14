(function() {
  'use strict';

  // We're relying on the server OAuth implementation
  // in order to keep track of connections and to
  // keep access/refesh tokens after logout using the
  // in app browser
  // https://github.com/apache/cordova-plugin-inappbrowser

  var OAUTH_PATH = '/auth/';

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
      const redirectUrl =  ENV.apiEndpoint + '/api/virtual/token';

      return {
        run: 'browser' === ENV.context ?
          runBrowser :
          runNative,
      };

      //
      function runBrowser(type, location) {
        var url = buildEndpoint(type, location);

        $log.debug('Browsing url: ' + url);
        $window.location.href = url;
        return $q.defer().promise;
      }
      function runNative(type) {
        var deferred = $q.defer();
        var url = buildEndpoint(type, redirectUrl);
        var oauthWindow = $window.open(
          url,
          '_blank',
          'location=yes,clearsessioncache=no,clearcache=no'
        );

        $log.debug('Opening url: ' + url);

        oauthWindow.addEventListener('loaderror', onLoadError);
        oauthWindow.addEventListener('loadstart', onLoadStart);
        oauthWindow.addEventListener('exit', onExit);

        function onExit() {
          $log.debug('OAuth exit.');
          deferred.reject();
        }
        function onLoadStart(event) {
          $log.debug('OAuth loadstart url:' + event.url);
          if(
            (event.url).startsWith(redirectUrl)
          ) {
            deferred.resolve(event.url.substring((redirectUrl + '/').length));
            oauthWindow.removeEventListener('exit', onExit);
            oauthWindow.removeEventListener('loaderror', onLoadError);
            oauthWindow.removeEventListener('loaderror', onLoadStart);
            oauthWindow.close();
          }
        }
        function onLoadError(event) {
          $log.debug(
            'OAuth loaderror: ' + event.url + ' - ' + event.code + ' - ' +
            event.message
          );
          oauthWindow.close();
          deferred.reject(new Error('OAUTH_LOAD_ERROR'));
        }

        return deferred.promise;
      }
      function buildEndpoint(type, location) {
        return ENV.apiEndpoint + OAUTH_PATH + type + (
          location ? '?url=' + encodeURIComponent(location) : ''
        );
      }
    }

  }());
