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

    function activate() {
    }

    function doDestroyAccount() {
      authService.deleteProfile()
        .then(function(logResponse) {
          $state.go('login');
        })
        .catch(function(err){
          $scope.fail = err;
        });
    }
  }
})();
