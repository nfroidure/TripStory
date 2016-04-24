(function() {
  'use strict';

  angular
    .module('app.destroy')
    .controller('DestroyCtrl', DestroyCtrl);

  DestroyCtrl.$inject = [
    '$scope', '$state', '$q',
    'authService', 'loadService',
  ];
  /* @ngInject */
  function DestroyCtrl(
    $scope, $state, $q,
    authService, loadService
  ) {
    $scope.doDestroyAccount = doDestroyAccount

    activate();

    //
    function activate() {
      $q.all(loadService.loadState($scope, {}));
    }

    function doDestroyAccount() {
      loadService.runState($scope, 'destroy', authService.deleteProfile())
      .then(function() {
        $state.go('login');
      });
    }
  }
})();
