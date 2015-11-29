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
