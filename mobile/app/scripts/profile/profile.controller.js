(function() {
  'use strict';

  angular
    .module('app.profile')
    .controller('ProfileCtrl', ProfileCtrl);

  ProfileCtrl.$inject = ['$scope', '$state', '$stateParams', 'AuthService', 'ENV'];
  /* @ngInject */
  function ProfileCtrl($scope, $state, $stateParams, AuthService, ENV) {
    $scope.profile = {};
    $scope.apiEndpoint = ENV.apiEndpoint;
    $scope.goUpdateProfile = goUpdateProfile;
    $scope.goDestroy = goDestroy;

    activate();

    function activate() {
      AuthService.getProfile({
        force: true,
      })
      .then(function(profile) {
        $scope.profile = profile;
      });
    }

    function goUpdateProfile() {
      if($scope.loginForm.$invalid) {
        return;
      }
      AuthService.setProfile($scope.profile)
      .then(function(res) {
        $scope.profile = profile;
      })
      .catch(function(err) {
        if (0 >= err.status) {
          $scope.fail = 'E_NETWORK';
          return;
        }
        $scope.fail = err.data && err.data.code ? err.data.code : 'E_UNEXPECTED';
      });
    }

    function goDestroy() {
      $state.go('app.destroy');
    }
  }

})();
