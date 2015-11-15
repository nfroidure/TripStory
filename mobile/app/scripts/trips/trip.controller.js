(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl);

  TripCtrl.$inject = ['$scope', '$state', '$stateParams', 'tripsFactory'];
  /* @ngInject */
  function TripCtrl($scope, $state, $stateParams, tripsFactory) {
    var idTrip = parseInt($stateParams.tripId);

    $scope.trip = {};
    $scope.goToMember = goToMember;

    activate();

    function activate() {
      $scope.trip = tripsFactory.get();
    }
    function goToMember(member) {
      $state.go('app.member', { memberId: member.id });
    }
  }

})();
