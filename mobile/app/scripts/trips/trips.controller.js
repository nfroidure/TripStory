(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripsCtrl', TripsCtrl)
    .controller('StartTripCtrl', StartTripCtrl);

  TripsCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$ionicModal', '$q',
    'tripsFactory', 'carsFactory', 'friendsFactory', 'pusherService',
  ];
  /* @ngInject */
  function TripsCtrl(
    $scope, $state, $stateParams, $ionicModal, $q,
    tripsFactory, carsFactory, friendsFactory, pusherService
  ) {
    var channel = pusherService.subscribe('trips');

    channel.bind_all(function(data) {
      if(-1 !== [
        'A_TRIP_CREATED', 'A_TRIP_UPDATED', 'A_TRIP_DELETED'
      ].indexOf(data.event)) {
        $scope.refresh();
      }
    });
    $scope.$on('$destroy', channel.unbind_all.bind(channel));

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
        tripsFactory.list()
          .then(function(values) {
            $scope.trips = values.data;
            $scope.state = 'loaded';
            canStartTrip = values.data.every(function(trip) {
              return trip.ended_date;
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
