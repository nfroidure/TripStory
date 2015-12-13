(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripsCtrl', TripsCtrl);

  TripsCtrl.$inject = ['$scope', '$state', '$stateParams', 'tripsFactory', '$ionicModal'];
  /* @ngInject */
  function TripsCtrl($scope, $state, $stateParams, tripsFactory, $ionicModal) {
    $scope.trips = [];
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
      $scope.state = 'loading';
      $scope.canCreateTrip = false;
      tripsFactory.list()
        .then(function(values) {
          $scope.trips = values.data;
          $scope.canCreateTrip = values.data.every(function(trip) {
            return trip.ended_date;
          });
          $scope.state = 'loaded';
        })
        .catch(function(err) {
          $scope.state = 'errored';
        });
    }

    function goToTrip(tripId){
      $state.go('app.trip', { trip_id: tripId });
    }

    function showCreateTripModal(){
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
