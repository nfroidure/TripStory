(function() {
  'use strict';

  angular
    .module('app.authentication')
    .controller('AuthCtrl', AuthCtrl);

  AuthCtrl.$inject = [
    '$scope', '$state', '$ionicModal', '$timeout', 'AuthService', 'ENV'
  ];
  /* @ngInject */
  function AuthCtrl($scope, $state, $ionicModal, $timeout, AuthService, ENV) {
    $scope.user = {};
    $scope.loginData = {};
    $scope.apiEndpoint = ENV.apiEndpoint;

    $scope.doLogin = doLogin;
    $scope.doSignup = doSignup;

    activate();

    function activate() {
      AuthService.getProfile().then(function(profile) {
        $state.go('app.trips');
      });
    }

    function doLogin() {
      if($scope.loginForm.$invalid) {
        return;
      }
      AuthService.log($scope.loginData)
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
      AuthService.signup($scope.loginData)
        .then(function(response) {
          $state.go("app.trips");
        })
        .catch(function(err) {
          if (0 >= err.status) {
            $scope.fail = 'E_NETWORK';
            return;
          }
          $scope.fail = err.data && err.data.code ? err.data.code : 'E_UNEXPECTED';
        });;
    }
  }
})();
