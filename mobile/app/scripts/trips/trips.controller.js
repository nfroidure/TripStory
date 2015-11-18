(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripsCtrl', TripsCtrl);

  TripsCtrl.$inject = ['$scope', '$state', '$stateParams', 'tripsFactory', '$ionicModal'];
  /* @ngInject */
  function TripsCtrl($scope, $state, $stateParams, tripsFactory, $ionicModal) {
    $scope.trips = [];

    $scope.showCreateTripModal = showCreateTripModal;
    $scope.closeCreateTripModal = closeCreateTripModal;
    $scope.goToTrip = goToTrip;

    $ionicModal.fromTemplateUrl('./templates/addTripModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    activate()

    function activate() {
      tripsFactory.list()
        .then(function(values) {
          $scope.trips = values.data;
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
  }

})();
