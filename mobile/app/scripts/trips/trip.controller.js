(function() {
  'use strict';

  var MIN_DISTANCE = 100;

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl)
    .controller('StopTripCtrl', StopTripCtrl)
    .controller('CommentTripCtrl', CommentTripCtrl);

  TripCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$q', '$ionicModal', '$log',
    'tripsFactory', 'pusherService', 'authService', 'loadService',
    'initGeoService', 'eventsFactory', 'createObjectId', 'toasterService',
    'geolib',
  ];
  /* @ngInject */
  function TripCtrl(
    $scope, $state, $stateParams, $q, $ionicModal, $log,
    tripsFactory, pusherService, authService, loadService,
    initGeoService, eventsFactory, createObjectId, toasterService,
    geolib
  ) {
    var geoService = initGeoService($scope);
    var lastPosition = null;

    $scope.trip = null;
    $scope.canStopTrip = false;
    $scope.goToUser = goToUser;
    $scope.mapClassEvent = mapClassEvent;
    $scope.goToMap = goToMap;
    $scope.stopTrip = stopTrip;
    $scope.closeStopTrip = closeStopTrip;
    $scope.commentTrip = commentTrip;
    $scope.closeCommentTrip = closeCommentTrip;
    $scope.togglePositionTracking = togglePositionTracking;
    $scope.refresh = activate;

    $scope.trackingPosition = false;

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
        var lastPositionEvent;

        $scope.profile = data.profile;
        $scope.trip = data.trip.data;
        lastPositionEvent = $scope.trip.events.reduce(function(event, candidateEvent) {
          if('geo' === candidateEvent.contents.type.split('-')[1]) {
            if(!event) {
              return candidateEvent;
            }
            if(
              (new Date(candidateEvent.created_date)).getTime() >
              (new Date(event.created_date)).getTime()
            ) {
              return candidateEvent;
            }
            return event;
          }
        }, {}.undef);
        lastPosition = lastPositionEvent ? {
          latitude: lastPositionEvent,
            latitude: lastPositionEvent.contents.geo[0],
            longitude: lastPositionEvent.contents.geo[1],
            altitude: lastPositionEvent.contents.geo[2],
        } : {}.undef;
        render();
      });
    }

    function render() {
      $scope.canStopTrip = $scope.trip.owner_id === $scope.profile._id &&
        !$scope.trip.ended_date;
      $scope.trackingPosition = geoService.watching();
    }

    function togglePositionTracking() {
      if(geoService.watching()) {
        geoService.stopWatch();
        toasterService.show('Location tracking disabled!');
      } else if(!$scope.trip.ended_date) {
        geoService.watchPosition();
        retrieveNextPosition();
        toasterService.show('Location tracking enabled!');
      }
      render();
    }

    function retrieveNextPosition() {
      if(geoService.watching()) {
        loadService.runState($scope, 'position', geoService.getPosition())
        .then(function(position) {
          if(positionsDiffers({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
          }, lastPosition)) {
            return sendPositionEvent(position).then(function() {
              lastPosition = position;
            });
          }
        })
        .catch(function(err) {
          $log.error(err);
        })
        .then(retrieveNextPosition);
      }
    }

    function positionsDiffers(position1, position2) {
      var distance;

      if((!position1) || (!position2)) {
        return true;
      }
      if(
        position1.latitude !== position2.latitude ||
        position1.longitude !== position2.longitude ||
        position1.altitude !== position2.altitude
      ) {
        distance = geolib.getDistance(position1, position2);
        return MIN_DISTANCE < distance;
      }
      return false;
    }

    function sendPositionEvent(position) {
      var event = {
        _id: createObjectId(),
        contents: {
          type: 'trip-geo',
          trip_id: $stateParams.trip_id,
          geo: [
            position.latitude,
            position.longitude,
          ],
        },
      };

      if(position.latitude) {
        event.contents.geo.push(position.latitude);
      }

      return loadService.runState($scope, 'sendposition',
        authService.getProfile().then(function(profile) {
          event.contents.user_id = profile._id;
          return eventsFactory.put(event);
        })
      );
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

    function commentTrip() {
      $ionicModal.fromTemplateUrl('./templates/commentTripModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.commentTripModal = modal;
        modal.show();
      });
    }

    function closeCommentTrip() {
      $scope.commentTripModal.remove();
      delete $scope.commentTripModal;
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

  CommentTripCtrl.$inject = [
    '$scope', '$stateParams',
    'createObjectId', 'eventsFactory', 'loadService', 'toasterService',
    'authService',
  ];
  /* @ngInject */
  function CommentTripCtrl(
    $scope, $stateParams,
    createObjectId, eventsFactory, loadService, toasterService,
    authService
  ) {
    $scope.tripCommentEvent = {
      _id: createObjectId(),
      contents: {
        type: 'trip-comment',
        trip_id: $stateParams.trip_id,
      },
    };
    $scope.commentTrip = commentTrip;

    function commentTrip() {
      if($scope.commentTripForm.$invalid) {
        return;
      }
      loadService.runState($scope, 'comment',
        authService.getProfile().then(function(profile) {
          $scope.tripCommentEvent.contents.author_id = profile._id;
          return eventsFactory.put($scope.tripCommentEvent);
        })
      ).then(function() {
        $scope.closeCommentTrip();
        $scope.refresh();
        toasterService.show('Comment sent!');
      });
    }
  }

})();
