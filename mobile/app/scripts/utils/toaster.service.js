(function() {
  'use strict';

  var TOAST_POSITION = 'top';
  var TOAST_DURATION = 2500;

  angular
    .module('app.utils')
    .service('toasterService', ToasterService);

    ToasterService.$inject = [
      '$cordovaToast', 'ionicToast',
      'ENV',
    ];
    /* @ngInject */
    function ToasterService(
      $cordovaToast, ionicToast,
      ENV
    ) {
      return {
        show: 'browser' === ENV.context ?
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
