(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('MapCtrl', MapCtrl);

  MapCtrl.$inject = ['$scope', '$state', '$stateParams', 'tripsFactory'];
  /* @ngInject */
  function MapCtrl($scope, $state, $stateParams, tripsFactory) {
    var tripId = $stateParams.trip_id;
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
      tripsFactory.get(tripId)
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
