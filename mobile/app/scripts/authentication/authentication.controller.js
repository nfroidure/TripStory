(function() {
  'use strict';

  angular
    .module('app.authentication')
    .controller('AuthCtrl', AuthCtrl);

  AuthCtrl.$inject = [
    '$scope', '$state', '$ionicModal', '$timeout', 'authService', 'ENV'
  ];
  /* @ngInject */
  function AuthCtrl($scope, $state, $ionicModal, $timeout, authService, ENV) {
    $scope.user = {};
    $scope.loginData = {};
    $scope.apiEndpoint = ENV.apiEndpoint;

    $scope.doLogin = doLogin;
    $scope.doSignup = doSignup;

    activate();

    function activate() {
      authService.getProfile().then(function(profile) {
        $state.go('app.trips');
      });
    }

    function doLogin() {
      if($scope.loginForm.$invalid) {
        return;
      }
      authService.log($scope.loginData)
        .then(function() {
          $state.go('app.trips');
        })
        .catch(function(err) {
          if (0 >= err.status) {
            $scope.fail = 'E_NETWORK';
            return;
          }
          $scope.fail = err.data && err.data.code ? err.data.code : 'E_UNEXPECTED';
        });
    }

    function doSignup() {
      if($scope.signupForm.$invalid) {
        return;
      }
      $scope.fail = '';
      authService.signup($scope.loginData)
        .then(function(response) {
          $state.go("app.trips");
        })
        .catch(function(err) {
          if (0 >= err.status) {
            $scope.fail = 'E_NETWORK';
            return;
          }
          $scope.fail = err.data && err.data.code ? err.data.code : 'E_UNEXPECTED';
        });
    }
  }
})();
