(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl);

  TripCtrl.$inject = ['$scope', '$stateParams'];
  /* @ngInject */
  function TripCtrl($scope, $stateParams) {
    $scope.idTrip = $stateParams.tripId;
  }

})();
