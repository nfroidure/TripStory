(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripsCtrl', TripsCtrl);

  TripsCtrl.$inject = ['$scope', '$state', '$stateParams', 'tripsFactory', '$ionicModal'];
  /* @ngInject */
  function TripsCtrl($scope, $state, $stateParams, tripsFactory, $ionicModal) {
    $scope.trips = [];
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
      tripsFactory.list()
        .then(function(values) {
          $scope.trips = values.data;
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
