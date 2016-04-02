(function() {
  'use strict';

  angular
    .module('app.menu')
    .controller('MenuCtrl', MenuCtrl);

  MenuCtrl.$inject = [
    '$scope', '$state', '$ionicHistory',
    'AuthService'
  ];
  /* @ngInject */
  function MenuCtrl(
    $scope, $state, $ionicHistory,
    AuthService
  ) {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });

    $scope.tripToAdd = { contents: {} };
    $scope.user = {};

    $scope.goToProfile = goToProfile;
    $scope.goToTrip = goToTrip;
    $scope.doLogout = doLogout;
    $scope.goToCars = goToCars;
    $scope.goToFriends = goToFriends;
    $scope.goToTrips = goToTrips;

    activate();
    $scope.$on('profile:update', activate);

    function activate() {
      AuthService.getProfile().then(function(profile) {
        $scope.user = profile;
      }).catch(function(err) {
        $state.go('login');
      });
    }

    // go to related page
    function goToProfile(trip) {
      $state.go('app.profile');
    }
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

    function doLogout() {
      AuthService.logout()
        .then(function(status) {
          $state.go('login');
        })
        .catch(function(err) {
          $scope.fail = err.data && err.data.code ? err.data.code : 'E_UNEXPECTED';
        });
    }
  }
})();
