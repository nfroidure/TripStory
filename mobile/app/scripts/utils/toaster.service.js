(function() {
  'use strict';

  var TOAST_POSITION = 'top';
  var TOAST_DURATION = 2500;

  angular
    .module('app.utils')
    .service('toasterService', ToasterService);

    ToasterService.$inject = [
      'ionicToast',
    ];
    /* @ngInject */
    function ToasterService(
      ionicToast
    ) {
      return {
        show: showToast,
      };

      //
      function showToast(message) {
        ionicToast.show(message, TOAST_POSITION, false, TOAST_DURATION);
      }
    }

  }());
