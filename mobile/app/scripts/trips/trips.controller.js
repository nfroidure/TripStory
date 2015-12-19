(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripsCtrl', TripsCtrl);

  TripsCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$ionicModal', '$q',
    'tripsFactory', 'carsFactory', 'friendsFactory',
  ];
  /* @ngInject */
  function TripsCtrl(
    $scope, $state, $stateParams, $ionicModal, $q,
    tripsFactory, carsFactory, friendsFactory
  ) {
    $scope.trips = [];
    $scope.cars = [];
    $scope.friends = [];
    $scope.canStartTrip = false;
    $scope.state = 'loading';

    $scope.newTrip = {};

    $scope.showStartTripModal = showStartTripModal;
    $scope.closeStartTripModal = closeStartTripModal;
    $scope.goToTrip = goToTrip;
    $scope.submitTrip = submitTrip;

    $ionicModal.fromTemplateUrl('./templates/startTripModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

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

    function goToTrip(tripId){
      $state.go('app.trip', { trip_id: tripId });
    }

    function showStartTripModal(){
      $scope.newTrip = {
        contents: {
          friends_ids: [],
        },
      };
      $scope.modal.show();
    }

    function closeStartTripModal(){
      $scope.modal.hide();
    }

    function submitTrip(){
      tripsFactory.put($scope.newTrip)
        .then(function() {
          activate();
          $scope.closeStartTripModal();
        });
    }
  }
})();
