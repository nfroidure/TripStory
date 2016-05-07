(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl)
    .controller('StopTripCtrl', StopTripCtrl);

  TripCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$q', '$ionicModal',
    'tripsFactory', 'pusherService', 'authService', 'loadService',
  ];
  /* @ngInject */
  function TripCtrl(
    $scope, $state, $stateParams, $q, $ionicModal,
    tripsFactory, pusherService, authService, loadService
  ) {

    $scope.trip = null;
    $scope.canStopTrip = false;
    $scope.goToUser = goToUser;
    $scope.mapClassEvent = mapClassEvent;
    $scope.goToMap = goToMap;
    $scope.stopTrip = stopTrip;
    $scope.closeStopTrip = closeStopTrip;
    $scope.refresh = activate;

    activate();

    pusherService.subscribe($scope, 'trips-' + $stateParams.trip_id, {
      A_TRIP_UPDATED: $scope.refresh.bind($scope),
      A_TRIP_DELETED: $state.go.bind($state, 'app.trips'),
    });

    function activate() {
      $scope.canStopTrip = false;
      $q.all(loadService.loadState($scope, {
        profile: authService.getProfile(),
        trip: tripsFactory.get($stateParams.trip_id),
      }))
      .then(function(data) {
        $scope.profile = data.profile;
        $scope.trip = data.trip.data;
        $scope.canStopTrip = $scope.trip.owner_id === data.profile._id &&
          !$scope.trip.ended_date;
      });
    }

    function goToUser(user) {
      $state.go('app.user', { user_id: user._id });
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
    '$scope', '$stateParams',
    'createObjectId', 'eventsFactory', 'loadService', 'toasterService',
  ];
  /* @ngInject */
  function StopTripCtrl(
    $scope, $stateParams,
    createObjectId, eventsFactory, loadService, toasterService
  ) {
    $scope.tripStopEvent = {
      _id: createObjectId(),
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
      loadService.runState($scope, 'stop',
        eventsFactory.put($scope.tripStopEvent)
      ).then(function() {
        $scope.closeStopTrip();
        $scope.refresh();
        toasterService.show('Destination reached!');
      });
    }
  }

})();
