(function() {
  'use strict';

  angular
    .module('app.destroy')
    .controller('DestroyCtrl', DestroyCtrl);

  DestroyCtrl.$inject = [
    '$scope', '$state', '$ionicModal', '$timeout', 'AuthService', 'ENV'
  ];
  /* @ngInject */
  function DestroyCtrl($scope, $state, $ionicModal, $timeout, AuthService, ENV) {
    $scope.doDestroyAccount = doDestroyAccount

    activate();

    function activate() {
    }

    function doDestroyAccount() {
      AuthService.deleteProfile()
        .then(function(logResponse) {
          $state.go('login');
        })
        .catch(function(err){
          $scope.fail = err;
        });
    }
  }
})();
