(function() {
  'use strict';

  angular
    .module('app.profile')
    .controller('ProfileCtrl', ProfileCtrl);

  ProfileCtrl.$inject = ['$scope', '$state', '$stateParams', 'AuthService'];
  /* @ngInject */
  function ProfileCtrl($scope, $state, $stateParams, carsFactory) {
    $scope.profile = {};

    activate();

    function activate() {
      AuthService.getProfile()
        .then(function(profile){
          $scope.profile = profile;
        })
    }
  }

})();
