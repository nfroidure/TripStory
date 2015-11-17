(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl);

  TripCtrl.$inject = ['$scope', '$state', '$stateParams', 'tripsFactory', 'profile', 'trip'];
  /* @ngInject */
  function TripCtrl($scope, $state, $stateParams, tripsFactory, profile, trip) {
    var idTrip = $stateParams.tripId;
    $scope.trip = trip;

    $scope.goToMember = goToMember;

    function goToMember(member) {
      $state.go('app.member', { memberId: member.id });
    }
  }

})();
