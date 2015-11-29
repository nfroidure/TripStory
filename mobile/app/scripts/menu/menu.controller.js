(function() {
  'use strict';

  angular
    .module('app.menu')
    .controller('MenuCtrl', MenuCtrl);

  MenuCtrl.$inject = [
    '$scope', '$state', '$ionicModal', '$timeout', '$http', 'tripsFactory',
    'AuthService', '$ionicHistory'
  ];
  /* @ngInject */
  function MenuCtrl(
    $scope, $state, $ionicModal, $timeout, $http, tripsFactory,
    AuthService, $ionicHistory
  ) {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });

    $scope.tripToAdd = { contents: {} };
    $scope.user = {};

    $scope.goToTrip = goToTrip;
    $scope.addTrip = addTrip;
    $scope.closeAddTrip = closeAddTrip;
    $scope.submitTrip = submitTrip;
    $scope.doLogout = doLogout;
    $scope.goToCars = goToCars;
    $scope.goToFriends = goToFriends;
    $scope.goToTrips = goToTrips;

    $ionicModal.fromTemplateUrl('templates/addTripModal.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.addTripModal = modal;
    });

    activate();

    function activate() {
      AuthService.getProfile().then(function(profile) {
        $scope.user = profile;
      }).catch(function(err) {
        console.log('No profile', err);
        $state.go('login');
      });
    }

    // go to related page
    function goToTrip(trip) {
      $state.go('app.trip', { tripId: trip._id });
    }
    function goToCars() {
      $state.go('app.cars', {});
    }
    function goToFriends() {
      $state.go('app.friends', {});
    }
    function goToTrips() {
      $state.go('app.trips', {});
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
