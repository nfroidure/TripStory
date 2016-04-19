(function() {
  'use strict';

  angular
    .module('app.destroy')
    .controller('DestroyCtrl', DestroyCtrl);

  DestroyCtrl.$inject = [
    '$scope', '$state', '$ionicModal', '$timeout', 'authService', 'ENV'
  ];
  /* @ngInject */
  function DestroyCtrl($scope, $state, $ionicModal, $timeout, authService, ENV) {
    $scope.doDestroyAccount = doDestroyAccount

    activate();

    //
    function activate() {
      $q.all(loadService.loadState($scope, {}));
    }

    function doDestroyAccount() {
      loadService.runState($scope, 'remove', authService.deleteProfile())
      .then(function() {
        $state.go('login');
      });
    }
  }
})();
