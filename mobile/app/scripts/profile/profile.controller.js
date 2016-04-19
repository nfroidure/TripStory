(function() {
  'use strict';

  angular
    .module('app.profile')
    .controller('ProfileCtrl', ProfileCtrl)
    .controller('UpdateProfileCtrl', UpdateProfileCtrl)
    .controller('UpdateAvatarProfileCtrl', UpdateAvatarProfileCtrl);

  ProfileCtrl.$inject = [
    '$scope', '$state', '$stateParams',
    'authService', 'ENV',
  ];
  /* @ngInject */
  function ProfileCtrl(
    $scope, $state, $stateParams,
    authService, ENV
  ) {
    $scope.profile = {};
    $scope.apiEndpoint = ENV.apiEndpoint;
    $scope.goDestroy = goDestroy;

    activate();

    function activate() {
      authService.getProfile({
        force: true,
      })
      .then(function(profile) {
        $scope.profile = profile;
      });
    }

    function goDestroy() {
      $state.go('app.destroy');
    }
  }

  UpdateProfileCtrl.$inject = ['$scope', 'authService'];
  /* @ngInject */
  function UpdateProfileCtrl($scope, authService) {
    $scope.updateProfile = updateProfile;

    function updateProfile() {
      if($scope.profileForm.$invalid) {
        return;
      }
      authService.setProfile($scope.profile)
      .then(function(profile) {
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
  }

  UpdateAvatarProfileCtrl.$inject = ['$scope', '$window', 'authService'];
  /* @ngInject */
  function UpdateAvatarProfileCtrl($scope, $window, authService) {
    $scope.setAvatar = setAvatar;

    function setAvatar() {
      var fileInput = $window.document.getElementById('uploader');

      if(fileInput.files[0]) {
        authService.setAvatar(fileInput.files[0]);
      }
    }
  }

})();
