(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripsCtrl', TripsCtrl);

  TripsCtrl.$inject = ['$scope', '$state', '$stateParams', 'tripsFactory'];
  /* @ngInject */
  function TripsCtrl($scope, $state, $stateParams, tripsFactory) {
    $scope.trips = [];


    activate()

    function activate() {
      tripsFactory.list()
        .then(function(values) {
          $scope.trips = values.data;
          console.log('$scope.trips', $scope.trips);
        });
    }

    $scope.goToTrip = function(tripId){
      $state.go('app.trip', { trip_id: tripId });
    }
  }

})();
