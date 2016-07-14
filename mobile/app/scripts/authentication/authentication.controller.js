(function() {
  'use strict';

  angular
    .module('app.authentication')
    .controller('AuthCtrl', AuthCtrl);

  AuthCtrl.$inject = [
    '$scope', '$state', '$ionicModal', '$timeout',
    'ENV', 'sfLoadService', 'authService', 'oAuthService',
  ];
  /* @ngInject */
  function AuthCtrl(
    $scope, $state, $ionicModal, $timeout,
    ENV, sfLoadService, authService, oAuthService
  ) {
    $scope.user = {};
    $scope.loginData = {};

    $scope.doLogin = doLogin;
    $scope.doOAuth = doOAuth;
    $scope.doSignup = doSignup;

    activate();

    function activate() {
      authService.getProfile()
      .then(function(profile) {
        console.log('going to trips');
        $state.go('app.trips');
      });
    }

    function doLogin() {
      if($scope.loginForm.$invalid) {
        return;
      }
      sfLoadService.runState($scope, 'login',
        authService.login($scope.loginData)
      )
      .then(function() {
        $state.go('app.trips');
      });
    }

    function doOAuth(type) {
      oAuthService.run(type)
      .then(function(token) {
        authService.setToken(token);
        activate();
      });
    }

    function doSignup() {
      if($scope.signupForm.$invalid) {
        return;
      }
      sfLoadService.runState($scope, 'signup',
        authService.signup($scope.loginData)
      )
      .then(function(response) {
        $state.go('app.trips');
      });
    }
  }
})();
