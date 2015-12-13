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
    $scope.canCreateTrip = false;
    $scope.state = 'loading';

    $scope.newTrip = {};

    $scope.showCreateTripModal = showCreateTripModal;
    $scope.closeCreateTripModal = closeCreateTripModal;
    $scope.goToTrip = goToTrip;
    $scope.submitTrip = submitTrip;

    $ionicModal.fromTemplateUrl('./templates/addTripModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    activate()

    function activate() {
      var canCreateTrip = false;

      $scope.state = 'loading';
      $scope.canCreateTrip = false;
      $q.all([
        tripsFactory.list()
          .then(function(values) {
            $scope.trips = values.data;
            $scope.state = 'loaded';
            canCreateTrip = values.data.every(function(trip) {
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
        $scope.canCreateTrip = canCreateTrip;
      })
      .catch(function(err) {
        $scope.state = 'errored';
      });
    }

    function goToTrip(tripId){
      $state.go('app.trip', { trip_id: tripId });
    }

    function showCreateTripModal(){
      $scope.newTrip = {
        contents: {
          friends_ids: [],
        },
      };
      $scope.modal.show();
    }

    function closeCreateTripModal(){
      $scope.modal.hide();
    }

    function submitTrip(){
      tripsFactory.put($scope.newTrip)
        .then(function(values) {
          activate();
          $scope.closeCreateTripModal();
        });
    }
  }
})();
