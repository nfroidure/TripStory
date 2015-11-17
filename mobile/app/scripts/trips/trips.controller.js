(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripsCtrl', TripsCtrl);

  TripsCtrl.$inject = ['$scope', '$state', '$stateParams', 'trips'];
  /* @ngInject */
  function TripsCtrl($scope, $state, $stateParams, trips) {
    $scope.trips = trips;
    console.log(trips);
  }

})();
