(function() {
  'use strict';

  angular
    .module('app.profile')
    .controller('ProfileCtrl', ProfileCtrl)
    .controller('UpdateProfileCtrl', UpdateProfileCtrl)
    .controller('UpdateAvatarProfileCtrl', UpdateAvatarProfileCtrl);

  ProfileCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$q',
    'sfLoadService',
    'ENV', 'authService',
  ];
  /* @ngInject */
  function ProfileCtrl(
    $scope, $state, $stateParams, $q,
    sfLoadService,
    ENV, authService
  ) {
    $scope.profile = {};
    $scope.apiEndpoint = ENV.apiEndpoint;
    $scope.goDestroy = goDestroy;

    activate();

    function activate() {
      $q.all(sfLoadService.loadState($scope, {
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
    'sfLoadService',
    'authService', 'toasterService',
  ];
  /* @ngInject */
  function UpdateProfileCtrl(
    $scope,
    sfLoadService,
    authService, toasterService
  ) {
    $scope.updateProfile = updateProfile;

    function updateProfile() {
      if($scope.profileForm.$invalid) {
        return;
      }
      sfLoadService.runState($scope, 'update',
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
    'sfLoadService',
    'authService', 'toasterService',
  ];
  /* @ngInject */
  function UpdateAvatarProfileCtrl(
    $scope, $window,
    sfLoadService,
    authService, toasterService
  ) {
    $scope.setAvatar = setAvatar;

    function setAvatar() {
      var fileInput = $window.document.getElementById('uploader');

      if(fileInput.files[0]) {
        sfLoadService.runState($scope, 'upload',
          authService.setAvatar(fileInput.files[0])
        ).then(function() {
          toasterService.show('Avatar uploaded!')
        });
      }
    }
  }

})();
