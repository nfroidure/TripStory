(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripsCtrl', TripsCtrl)
    .controller('StartTripCtrl', StartTripCtrl);

  TripsCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$ionicModal', '$q',
    'sfLoadService',
    'tripsFactory', 'carsFactory', 'friendsFactory', 'pusherService',
    'authService', 'toasterService',
  ];
  /* @ngInject */
  function TripsCtrl(
    $scope, $state, $stateParams, $ionicModal, $q,
    sfLoadService,
    tripsFactory, carsFactory, friendsFactory, pusherService,
    authService, toasterService
  ) {
    $scope.trips = [];
    $scope.cars = [];
    $scope.friends = [];
    $scope.canStartTrip = false;

    $scope.createTrip = createTrip;
    $scope.closeCreateTrip = closeCreateTrip;
    $scope.goToTrip = goToTrip;
    $scope.removeTrip = removeTrip;
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
      $q.all(sfLoadService.loadState($scope, {
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

    function removeTrip(id, event) {
      event.stopPropagation();
      sfLoadService.runState($scope, 'remove', tripsFactory.remove(id))
      .then(function() {
        $scope.refresh();
        toasterService.show('Trip removed!');
      });
    }

    function goToTrip(tripId) {
      $state.go('app.trip', { trip_id: tripId });
    }
  }

  StartTripCtrl.$inject = [
    '$scope',
    'sfLoadService',
    'tripsFactory', 'createObjectId', 'toasterService',
  ];
  /* @ngInject */
  function StartTripCtrl(
    $scope,
    sfLoadService,
    tripsFactory, createObjectId, toasterService
  ) {
    $scope.newTrip = {
      _id: createObjectId(),
      contents: {
        friends_ids: [],
      },
    };
    $scope.submitTrip = submitTrip;

    function submitTrip() {
      if($scope.tripForm.$invalid) {
        return;
      }
      sfLoadService.runState($scope, 'start',
        tripsFactory.put($scope.newTrip)
      ).then(function(response) {
        $scope.closeCreateTrip();
        $scope.goToTrip(response.data._id);
        toasterService.show('Trip created!');
      });
    }

  }
})();
