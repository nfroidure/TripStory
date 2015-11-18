(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl);

  TripCtrl.$inject = ['$scope', '$state', '$stateParams', 'tripsFactory'];
  /* @ngInject */
  function TripCtrl($scope, $state, $stateParams, tripsFactory) {
    var tripId = $stateParams.trip_id;
    // $scope.trip = trip;

    $scope.trip = {};
    $scope.startEvent = '';
    $scope.goToMember = goToMember;
    $scope.mapClassEvent = mapClassEvent;

    activate();

    function activate() {
      tripsFactory.get(tripId)
        .then(function(trip){
          console.log('trip', trip);
          $scope.trip = trip.data;
        })
      // $scope.startEvent = $scope.trip.events.filter(isPsaGeo)[0];
      // function isPsaGeo(event){ return event.contents.type === 'psa-geo'; }
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
