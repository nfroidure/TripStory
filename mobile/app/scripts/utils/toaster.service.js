(function() {
  'use strict';

  var TOAST_POSITION = 'top';
  var TOAST_DURATION = 2500;

  // Since it looks like there is no way to guess the platform is
  // a simple web nrowser, let's assume it is when a device has no props
  var platformIsWeb = 0 === Object.keys(ionic.Platform.device()).length;

  angular
    .module('app.utils')
    .service('toasterService', ToasterService);

    ToasterService.$inject = [
      '$cordovaToast',
      'ionicToast',
    ];
    /* @ngInject */
    function ToasterService(
      ngCordova,
      ionicToast
    ) {
      return {
        show: platformIsWeb ?
          showWebToast :
          showNativeToast,
      };

      //
      function showWebToast(message) {
        ionicToast.show(message, TOAST_POSITION, false, TOAST_DURATION);
      }
      function showNativeToast(message) {
        $cordovaToast.show(message, TOAST_DURATION, TOAST_POSITION);
      }
    }

  }());
