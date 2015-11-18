(function() {
  'use strict';

  angular
    .module('app')
    .controller('AuthCtrl', AuthCtrl);

  AuthCtrl.$inject = ['$scope', '$state', '$ionicModal', '$timeout', 'AuthService'];
  /* @ngInject */
  function AuthCtrl($scope, $state, $ionicModal, $timeout, AuthService) {
    $scope.user = {}
    $scope.loginData = {}

    $scope.doLogin = doLogin;
    $scope.doSignup = doSignup;

    function doLogin() {
      AuthService.log($scope.loginData)
        .then(function(logResponse) {
          $state.go('app.trips');
        })
        .catch(function(err){ $scope.fail = err; });
    }

    function doSignup() {
      AuthService.signup($scope.loginData)
        .then(function(logResponse) {
          if (logResponse.status === 200) {
            $state.go("app.trips");
          }
        })
        .catch(function(err){ $scope.fail = err; });
    }
  }
})();
