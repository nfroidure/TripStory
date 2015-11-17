(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripsCtrl', TripsCtrl);

  TripsCtrl.$inject = ['$scope', '$state', '$stateParams', 'trips'];
  /* @ngInject */
  function TripsCtrl($scope, $state, $stateParams, trips) {
    $scope.trips = trips;

    $scope.goToTrip = function(trip){
      $state.go("app.trip", {trip_id: trip._id});
    }
  }

})();
