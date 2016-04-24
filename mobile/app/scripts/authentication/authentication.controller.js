(function() {
  'use strict';

  angular
    .module('app.authentication')
    .controller('AuthCtrl', AuthCtrl);

  AuthCtrl.$inject = [
    '$scope', '$state', '$ionicModal', '$timeout',
    'ENV', 'loadService', 'authService',
  ];
  /* @ngInject */
  function AuthCtrl(
    $scope, $state, $ionicModal, $timeout,
    ENV, loadService, authService
  ) {
    $scope.user = {};
    $scope.loginData = {};
    $scope.apiEndpoint = ENV.apiEndpoint;

    $scope.doLogin = doLogin;
    $scope.doSignup = doSignup;

    activate();

    function activate() {
      authService.getProfile()
      .then(function(profile) {
        $state.go('app.trips');
      });
    }

    function doLogin() {
      if($scope.loginForm.$invalid) {
        return;
      }
      loadService.runState($scope, 'login',
        authService.login($scope.loginData)
      )
      .then(function() {
        $state.go('app.trips');
      });
    }

    function doSignup() {
      if($scope.signupForm.$invalid) {
        return;
      }
      loadService.runState($scope, 'signup',
        authService.signup($scope.loginData)
      )
      .then(function(response) {
        $state.go("app.trips");
      });
    }
  }
})();
