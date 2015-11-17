(function() {
  'use strict';

  angular
    .module('app')
    .controller('AppCtrl', AppCtrl);

  AppCtrl.$inject = ['$scope', '$state', '$ionicModal', '$timeout', '$http', 'tripsFactory', 'AuthService', '$ionicHistory', 'profile'];
  /* @ngInject */
  function AppCtrl($scope, $state, $ionicModal, $timeout, $http, tripsFactory, AuthService, $ionicHistory, profile) {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });

    $scope.tripToAdd = { contents: {} };

    $scope.user = profile;

    $scope.addTrip = addTrip;
    $scope.closeAddTrip = closeAddTrip;
    $scope.submitTrip = submitTrip;
    $scope.doLogout = doLogout;

    $ionicModal.fromTemplateUrl('templates/addTripModal.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.addTripModal = modal;
    });

    // add trip
    function addTrip() {
      $scope.addTripModal.show();
    }
    function closeAddTrip() {
      $scope.addTripModal.hide();
    }
    function submitTrip() {
      tripsFactory.post($scope.tripToAdd);
    }

    function doLogout() {
      AuthService.logout()
        .then(function(status) {
          if (status.status === 204) {
            $scope.user = {};
            $state.go("login");
          }
        })
        .catch(function(err){ $scope.fail = err; });
    }
  }
})();
