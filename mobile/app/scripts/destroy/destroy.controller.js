(function() {
  'use strict';

  angular
    .module('app.destroy')
    .controller('DestroyCtrl', DestroyCtrl);

  DestroyCtrl.$inject = [
    '$scope', '$state', '$q',
    'sfLoadService',
    'authService', 'toasterService',
  ];
  /* @ngInject */
  function DestroyCtrl(
    $scope, $state, $q,
    sfLoadService,
    authService, toasterService
  ) {
    $scope.doDestroyAccount = doDestroyAccount

    activate();

    //
    function activate() {
      $q.all(sfLoadService.loadState($scope, {}));
    }

    function doDestroyAccount() {
      sfLoadService.runState($scope, 'destroy', authService.deleteProfile())
      .then(function() {
        $state.go('login');
        toasterService.show('So, you quit :\'(');
      });
    }
  }
})();
