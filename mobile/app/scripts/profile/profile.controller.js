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
      AuthService.getProfile()
        .then(function(profile){
          $scope.profile = profile;
        });
    }

    function goUpdateProfile() {
      AuthService.setProfile($scope.profile);
    }

    function goDestroy() {
      $state.go('app.destroy');
    }
  }

})();
