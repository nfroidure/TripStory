(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripsCtrl', TripsCtrl)
    .controller('StartTripCtrl', StartTripCtrl);

  TripsCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$ionicModal', '$q',
    'tripsFactory', 'carsFactory', 'friendsFactory', 'pusherService',
    'authService',
  ];
  /* @ngInject */
  function TripsCtrl(
    $scope, $state, $stateParams, $ionicModal, $q,
    tripsFactory, carsFactory, friendsFactory, pusherService,
    authService
  ) {
    authService.getProfile().then(function(profile) {

      pusherService.subscribe( $scope, 'users-' + profile._id, {
        A_TRIP_UPDATED: $scope.refresh.bind($scope),
        A_TRIP_CREATED: $scope.refresh.bind($scope),
        A_TRIP_DELETED: $scope.refresh.bind($scope),
      });
      $scope.profile = profile;
    });

    $scope.trips = [];
    $scope.cars = [];
    $scope.friends = [];
    $scope.canStartTrip = false;
    $scope.state = 'loading';

    $scope.createTrip = createTrip;
    $scope.closeCreateTrip = closeCreateTrip;
    $scope.goToTrip = goToTrip;
    $scope.refresh = activate;

    activate()

    function activate() {
      var canStartTrip = false;

      $scope.state = 'loading';
      $scope.canStartTrip = false;
      $q.all([
        authService.getProfile().then(function(profile) {
          return tripsFactory.list()
          .then(function(values) {
            $scope.trips = values.data;
            $scope.state = 'loaded';
            canStartTrip = values.data.every(function(trip) {
              return trip.owner_id !== result.profile._id || trip.ended_date;
            });
          });
        }),
        carsFactory.list()
          .then(function(values) {
            $scope.cars = values.data;
          }),
        friendsFactory.list()
          .then(function(values) {
            $scope.friends = values.data;
          }),
      ])
      .then(function() {
        $scope.canStartTrip = canStartTrip;
      })
      .catch(function(err) {
        $scope.state = 'errored';
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
