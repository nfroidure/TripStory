(function() {
  'use strict';

  angular
    .module('app')
    .controller('AppCtrl', AppCtrl);

  AppCtrl.$inject = ['$scope', '$state', '$ionicModal', '$timeout', '$http', 'tripsFactory', 'me', 'AuthService'];
  /* @ngInject */
  function AppCtrl($scope, $state, $ionicModal, $timeout, $http, tripsFactory, me, AuthService) {
    $scope.tripToAdd = { contents: {} };
    $scope.trips = [];

    $scope.user = me.data;

    $scope.goToTrip = goToTrip;
    $scope.addTrip = addTrip;
    $scope.closeAddTrip = closeAddTrip;
    $scope.submitTrip = submitTrip;
    $scope.doLogout = doLogout;

    $ionicModal.fromTemplateUrl('templates/addTripModal.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.addTripModal = modal;
    });

    activate();

    function activate() {
      tripsFactory.get().then(
        function(values){
          $scope.trips = values.data;
        }
      );
    }

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
