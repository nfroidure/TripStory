(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('MapCtrl', MapCtrl);

  MapCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$q',
    'tripsFactory', 'pusherService', 'loadService', 'authService',
  ];
  /* @ngInject */
  function MapCtrl(
    $scope, $state, $stateParams, $q,
    tripsFactory, pusherService, loadService, authService
  ) {
    $scope.trip = [];
    $scope.map = {
      center: {
        latitude: 50.633020,
        longitude: 3.019070,
      },
      zoom: 8,
    };

    $scope.markers = [];
    $scope.refresh = activate;

    pusherService.subscribe( $scope, 'trips-' + $stateParams.trip_id, {
      A_TRIP_UPDATED: $scope.refresh.bind($scope),
      A_TRIP_DELETED: $state.go.bind($state, 'app.trips'),
    });

    activate()

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
        $scope.markers = $scope.trip.events
          .filter(isLocatedEvent)
          .map(locatedEventToMapMarker);
      });
    }

  }

  function isLocatedEvent(event) {
    return event.contents.geo;
  }

  function locatedEventToMapMarker(event, i) {
    return {
      id: i,
      latitude: parseFloat(event.contents.geo[0]),
      longitude: parseFloat(event.contents.geo[1]),
    };
  }

})();
