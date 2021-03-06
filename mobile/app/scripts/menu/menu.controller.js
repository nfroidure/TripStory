(function() {
  'use strict';

  angular
    .module('app.menu')
    .controller('MenuCtrl', MenuCtrl);

  MenuCtrl.$inject = [
    '$scope', '$state', '$ionicHistory',
    'authService'
  ];
  /* @ngInject */
  function MenuCtrl(
    $scope, $state, $ionicHistory,
    authService
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
    $scope.goToAbout = goToAbout;

    activate();
    $scope.$on('profile:update', activate);

    function activate() {
      authService.getProfile()
      .then(function(profile) {
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
    function goToAbout() {
      $state.go('app.about', {});
    }

    function doLogout() {
      authService.logout()
      .then(function() {
        $state.go('login');
      });
    }
  }
})();
