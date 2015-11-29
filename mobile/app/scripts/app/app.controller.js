(function() {
  'use strict';

  angular
    .module('app')
    .controller('AppCtrl', AppCtrl);

  AppCtrl.$inject = [
    '$scope', '$state', '$ionicModal', '$timeout', '$http', '$ionicHistory',
  ];
  /* @ngInject */
  function AppCtrl(
    $scope, $state, $ionicModal, $timeout, $http, $ionicHistory
  ) {
    // Main app
  }
})();
