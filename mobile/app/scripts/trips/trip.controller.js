(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl);

  TripCtrl.$inject = ['$scope', '$state', '$stateParams', 'tripsFactory', 'profile', 'trip'];
  /* @ngInject */
  function TripCtrl($scope, $state, $stateParams, tripsFactory, profile, trip) {
    var idTrip = $stateParams.tripId;
    // $scope.trip = trip;

    $scope.trip = {};
    $scope.startEvent = '';
    $scope.goToMember = goToMember;
    $scope.mapClassEvent = mapClassEvent;

    activate();

    function activate() {
      $scope.trip = tripsFactory.get('mock')
      $scope.startEvent = $scope.trip.events.filter(isPsaGeo)[0];
      console.log('$scope.startEvent', $scope.startEvent);
      function isPsaGeo(event){ return event.contents.type === 'psa-geo'; }
    }
    function goToMember(member) {
      $state.go('app.member', { memberId: member.id });
    }
    function mapClassEvent(type) {
      var classes = {
        'trip-start': 'event__start',
        'twitter-status': 'event__twitter',
        'psa-geo': 'event__psa',
        'xee-geo': 'event__xee',
        'trip-stop': 'event__stop',
      };
      return classes[type];
    }
  }

})();
