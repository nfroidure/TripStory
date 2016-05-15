(function() {
  'use strict';

  // A simple wrapper for geolocation$
  // https://developer.mozilla.org/fr/docs/Using_geolocation

  // Since it looks like there is no way to guess the platform is
  // a simple web nrowser, let's assume it is when a device has no props
  var platformIsWeb = 0 === Object.keys(ionic.Platform.device()).length;

  angular
    .module('app.utils')
    .service('initGeoService', GeoService);

    GeoService.$inject = [
      '$q', '$log',
    ];
    /* @ngInject */
    function GeoService(
      $q, $log
    ) {


      return initWatchService;

      //
      function initWatchService($scope) {
        var watchId;
        var deferredPosition = $q.defer();
        var positionService = {
          watchPosition: watchPosition,
          getPosition: getPosition,
          stopWatch: stopWatch,
          watching: watching,
        };

        $scope.$on('destroy', stopWatch);

        return positionService;

        function watchPosition() {
          if(watchId) {
            throw new Error('E_NOT_WATCHING');
          }
          watchId = navigator.geolocation.watchPosition(
            positionCallback,
            positionError, {
              enableHighAccuracy: true,
              maximumAge: 60000,
            }
          );
        }

        function positionCallback(position) {
          $log.debug('Got a new position:', position);
          deferredPosition.resolve(position);
          deferredPosition = $q.defer();
        }

        function positionError(err) {
          $log.debug('Could not get position:', err);
          deferredPosition.reject(err);
          deferredPosition = $q.defer();
        }

        function stopWatch() {
          if(!watchId) {
            throw new Error('E_NOT_WATCHING');
          }
          navigator.geolocation.clearWatch.bind(
            navigator.geolocation,
            watchId
          );
          watchId = {}.undef;
        }

        function watching() {
          return !!watchId;
        }

        function getPosition() {
          if(!watchId) {
            deferredPosition.reject(new Error('E_NOT_WATCHING'));
            return deferredPosition.promise;
          }
          return deferredPosition.promise;
        }
      }
    }

  }());
