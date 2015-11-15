(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl);

  TripCtrl.$inject = ['$scope', '$stateParams', 'tripsFactory'];
  /* @ngInject */
  function TripCtrl($scope, $stateParams, tripsFactory) {
    var idTrip = parseInt($stateParams.tripId);

    $scope.trip = {};

    activate();

    function activate() {
      $scope.trip = tripsFactory.get(idTrip);
    }
  }

})();
