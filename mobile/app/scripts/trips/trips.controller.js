(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripsCtrl', TripsCtrl)
    .controller('StartTripCtrl', StartTripCtrl);

  TripsCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$ionicModal', '$q',
    'tripsFactory', 'carsFactory', 'friendsFactory', 'pusherService',
    'authService', 'loadService',
  ];
  /* @ngInject */
  function TripsCtrl(
    $scope, $state, $stateParams, $ionicModal, $q,
    tripsFactory, carsFactory, friendsFactory, pusherService,
    authService, loadService
  ) {
    $scope.trips = [];
    $scope.cars = [];
    $scope.friends = [];
    $scope.canStartTrip = false;

    $scope.createTrip = createTrip;
    $scope.closeCreateTrip = closeCreateTrip;
    $scope.goToTrip = goToTrip;
    $scope.refresh = activate;

    activate()

    authService.getProfile().then(function(profile) {
      pusherService.subscribe( $scope, 'users-' + profile._id, {
        A_TRIP_UPDATED: $scope.refresh.bind($scope),
        A_TRIP_CREATED: $scope.refresh.bind($scope),
        A_TRIP_DELETED: $scope.refresh.bind($scope),
      });
      $scope.profile = profile;
    });

    function activate() {
      $scope.canStartTrip = false;
      $q.all(loadService.loadState($scope, {
        profile: authService.getProfile(),
        trips: tripsFactory.list(),
        cars: carsFactory.list(),
        friends: friendsFactory.list(),
      }))
      .then(function(data) {
        $scope.canStartTrip = data.trips.data.every(function(trip) {
          return trip.owner_id !== data.profile._id || trip.ended_date;
        });
        $scope.trips = data.trips.data;
        $scope.profile = data.profile;
        $scope.cars = data.cars.data;
        $scope.friends = data.friends.data;
      });
    }

    function createTrip() {
      $ionicModal.fromTemplateUrl('./templates/startTripModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.createTripModal = modal;
        modal.show();
      });
    }

    function closeCreateTrip() {
      $scope.createTripModal.remove();
      delete $scope.createTripModal;
    }

    function goToTrip(tripId) {
      $state.go('app.trip', { trip_id: tripId });
    }
  }

  StartTripCtrl.$inject = [
    '$scope', 'tripsFactory',
  ];
  /* @ngInject */
  function StartTripCtrl($scope, tripsFactory) {
    $scope.newTrip = {
      contents: {
        friends_ids: [],
      },
    };
    $scope.submitTrip = submitTrip;

    function submitTrip() {
      if($scope.tripForm.$invalid) {
        return;
      }
      $scope.fail = '';
      tripsFactory.put($scope.newTrip)
        .then(function(response) {
          $scope.closeCreateTrip();
          $scope.refresh();
          $scope.goToTrip(response.data._id);
        })
        .catch(function(err) {
          if (0 >= err.status) {
            $scope.fail = 'E_NETWORK';
            return;
          }
          $scope.fail = err.data && err.data.code ? err.data.code : 'E_UNEXPECTED';
        });
    }

  }
})();
