(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('MapCtrl', MapCtrl);

  MapCtrl.$inject = [
    '$scope', '$state', '$stateParams', 'tripsFactory', 'pusherService'
  ];
  /* @ngInject */
  function MapCtrl($scope, $state, $stateParams, tripsFactory, pusherService) {
    var channel = pusherService.subscribe('trips-' + $stateParams.trip_id);

    channel.bind('A_TRIP_UPDATED', function() {
      $scope.refresh();
    });
    channel.bind('A_TRIP_DELETED', function() {
      $state.go('app.trips');
    });
    $scope.$on('$destroy', channel.unbind.bind(channel, 'A_TRIP_UPDATED'));
    $scope.$on('$destroy', channel.unbind.bind(channel, 'A_TRIP_DELETED'));

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

    activate()

    function activate() {
      tripsFactory.get($stateParams.trip_id)
        .then(function(values) {
          $scope.trip = values.data;
          var events = $scope.trip.events;
          $scope.markers = events
            .filter(whoAreGPSEvents)
            .map(makeGMapMarker);
            function whoAreGPSEvents(eventData){
              return eventData.contents.geo;
            }
            function makeGMapMarker(eventData, i){
              return {
                id: i,
                latitude: parseFloat(eventData.contents.geo[0]),
                longitude: parseFloat(eventData.contents.geo[1]),
              };
            }
        });
    }

  }

})();
