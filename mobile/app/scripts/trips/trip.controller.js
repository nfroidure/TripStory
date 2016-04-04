(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl)
    .controller('StopTripCtrl', StopTripCtrl);

  TripCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$q', '$ionicModal',
    'tripsFactory', 'pusherService', 'authService',
  ];
  /* @ngInject */
  function TripCtrl(
    $scope, $state, $stateParams, $q, $ionicModal,
    tripsFactory, pusherService, authService
  ) {

    $scope.trip = null;
    $scope.canStopTrip = false;
    $scope.state = 'loading';
    $scope.startEvent = '';
    $scope.goToMember = goToMember;
    $scope.mapClassEvent = mapClassEvent;
    $scope.goToMap = goToMap;
    $scope.stopTrip = stopTrip;
    $scope.closeStopTrip = closeStopTrip;
    $scope.refresh = activate;

    pusherService.subscribe( $scope, 'trips-' + $stateParams.trip_id, {
      A_TRIP_UPDATED: $scope.refresh.bind($scope),
      A_TRIP_DELETED: $state.go.bind($state, 'app.trips'),
    });
    activate();

    function activate() {
      $scope.state = 'loading';
      $scope.canStopTrip = false;
      $q.all({
        profile: authService.getProfile(),
        trip: tripsFactory.get($stateParams.trip_id),
      })
      .then(function(result) {
        $scope.profile = result.profile;
        $scope.trip = result.trip.data;
        $scope.state = 'loaded';
        $scope.canStopTrip = $scope.trip.owner_id === result.profile._id &&
          !$scope.trip.ended_date;
      })
      .catch(function(err) {
        $scope.state = 'errored';
      });
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

    function stopTrip() {
      $ionicModal.fromTemplateUrl('./templates/stopTripModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.stopTripModal = modal;
        modal.show();
      });
    }

    function closeStopTrip() {
      $scope.stopTripModal.remove();
      delete $scope.stopTripModal;
    }
  }

  StopTripCtrl.$inject = [
    '$scope', '$stateParams', 'eventsFactory',
  ];
  /* @ngInject */
  function StopTripCtrl($scope, $stateParams, eventsFactory) {
    $scope.tripStopEvent = {
      contents: {
        type: 'trip-stop',
        trip_id: $stateParams.trip_id,
      },
    };
    $scope.stopTrip = stopTrip;

    function stopTrip() {
      if($scope.stopTripForm.$invalid) {
        return;
      }
      $scope.fail = '';
      eventsFactory.put($scope.tripStopEvent)
        .then(function() {
          $scope.closeStopTrip();
          $scope.refresh();
        })
        .catch(function(err) {
          if (0 >= err.status) {
            $scope.fail = 'E_NETWORK';
            return;
          }
          $scope.fail = err.data && err.data.code ? err.data.code : 'E_UNEXPECTED';
        });
    }
  }

})();
