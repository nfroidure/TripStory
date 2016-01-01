(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl);

  TripCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$ionicModal',
    'tripsFactory', 'eventsFactory',
  ];
  /* @ngInject */
  function TripCtrl(
    $scope, $state, $stateParams, $ionicModal,
    tripsFactory, eventsFactory
  ) {
    $scope.trip = null;
    $scope.canStopTrip = false;
    $scope.state = 'loading';
    $scope.startEvent = '';
    $scope.goToMember = goToMember;
    $scope.mapClassEvent = mapClassEvent;
    $scope.goToMap = goToMap;
    $scope.showStopTripModal = showStopTripModal;
    $scope.closeStopTripModal = closeStopTripModal;
    $scope.stopTrip = stopTrip;
    $scope.refresh = activate;

    $ionicModal.fromTemplateUrl('./templates/stopTripModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });

    activate();

    function activate() {
      $scope.state = 'loading';
      $scope.canStopTrip = false;
      tripsFactory.get($stateParams.trip_id)
        .then(function(trip) {
          $scope.trip = trip.data;
          $scope.state = 'loaded';
          $scope.canStopTrip = $scope.trip.ended_date;
        })
        .catch(function(err) {
          $scope.state = 'errored';
        });
      // $scope.startEvent = $scope.trip.events.filter(isPsaGeo)[0];
      // function isPsaGeo(event){ return event.contents.type === 'psa-geo'; }
    }
    function goToMember(member) {
      $state.go('app.member', { memberId: member.id });
    }
    function goToMap() {
      $state.go('app.tripMap', { trip_id: $stateParams.trip_id});
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

    function showStopTripModal() {
      $scope.tripStopEvent = {
        contents: {
          type: 'trip-stop',
          trip_id: $stateParams.trip_id,
        },
      };
      $scope.modal.show();
    }

    function closeStopTripModal() {
      $scope.modal.hide();
    }

    function stopTrip() {
      eventsFactory.put($scope.tripStopEvent)
        .then(function() {
          $scope.closeStopTripModal();
          activate();
        });
    }
  }

})();
