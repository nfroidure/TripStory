(function() {
  'use strict';

  angular
    .module('app.profile')
    .controller('ProfileCtrl', ProfileCtrl)
    .controller('UpdateProfileCtrl', UpdateProfileCtrl)
    .controller('UpdateAvatarProfileCtrl', UpdateAvatarProfileCtrl);

  ProfileCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$q',
    'ENV', 'authService', 'loadService',
  ];
  /* @ngInject */
  function ProfileCtrl(
    $scope, $state, $stateParams, $q,
    ENV, authService, loadService
  ) {
    $scope.profile = {};
    $scope.apiEndpoint = ENV.apiEndpoint;
    $scope.goDestroy = goDestroy;

    activate();

    function activate() {
      $q.all(loadService.loadState($scope, {
        profile: authService.getProfile({
          force: true,
        }),
      }))
      .then(function(data) {
        $scope.profile = data.profile;
      });
    }

    function goDestroy() {
      $state.go('app.destroy');
    }
  }

  UpdateProfileCtrl.$inject = [
    '$scope',
    'authService', 'loadService', 'toasterService',
  ];
  /* @ngInject */
  function UpdateProfileCtrl(
    $scope,
    authService, loadService, toasterService
  ) {
    $scope.updateProfile = updateProfile;

    function updateProfile() {
      if($scope.profileForm.$invalid) {
        return;
      }
      loadService.runState($scope, 'update',
        authService.setProfile($scope.profile)
      )
      .then(function(profile) {
        $scope.profile = profile;
        toasterService.show('Profile updated!');
      });
    }
  }

  UpdateAvatarProfileCtrl.$inject = [
    '$scope', '$window',
    'authService', 'loadService', 'toasterService',
  ];
  /* @ngInject */
  function UpdateAvatarProfileCtrl(
    $scope, $window,
    authService, loadService, toasterService
  ) {
    $scope.setAvatar = setAvatar;

    function setAvatar() {
      var fileInput = $window.document.getElementById('uploader');

      if(fileInput.files[0]) {
        loadService.runState($scope, 'upload',
          authService.setAvatar(fileInput.files[0])
        ).then(function() {
          toasterService.show('Avatar uploaded!')
        });
      }
    }
  }

})();
