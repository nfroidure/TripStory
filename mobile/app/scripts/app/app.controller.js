(function() {
  'use strict';

  angular
    .module('app')
    .controller('AppCtrl', AppCtrl);

  AppCtrl.$inject = ['$scope', '$state', '$ionicModal', '$timeout', 'userService', '$http', 'tripsFactory', 'AuthService', '$ionicHistory'];
  /* @ngInject */
  function AppCtrl($scope, $state, $ionicModal, $timeout, userService, $http, tripsFactory, AuthService, $ionicHistory) {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    //$scope.isLogged = !!AuthService.getId();
    $scope.tripToAdd = { contents: {} };
    $scope.user = {};
    $scope.addTrip = addTrip;
    $scope.closeAddTrip = closeAddTrip;
    $scope.submitTrip = submitTrip;
    $scope.doLogout = doLogout;

    activate()

    function activate() {
      userService.getUser()
        .then(function(value) { $scope.user = value.data.contents })
    }

    $ionicModal.fromTemplateUrl('templates/addTripModal.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.addTripModal = modal;
    });

    // go to related page
    function goToTrip(trip) {
      $state.go('app.trip', { tripId: trip._id });
    }
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
