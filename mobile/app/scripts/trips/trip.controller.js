(function() {
  'use strict';

  var MIN_DISTANCE = 50;
  var MIN_STOP_DURATION = 5 * 60 * 1000; // 5 minutes
  var MIN_SPEED = 5 * 1000 / 3600000; // 5 km/h

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl)
    .controller('StopTripCtrl', StopTripCtrl)
    .controller('CommentTripCtrl', CommentTripCtrl);

  TripCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$q', '$ionicModal', '$log',
    'sfLoadService',
    'tripsFactory', 'pusherService', 'authService',
    'initGeoService', 'eventsFactory', 'createObjectId', 'toasterService',
    'geolib',
  ];
  /* @ngInject */
  function TripCtrl(
    $scope, $state, $stateParams, $q, $ionicModal, $log,
    sfLoadService,
    tripsFactory, pusherService, authService,
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
      $q.all(sfLoadService.loadState($scope, {
        profile: authService.getProfile(),
        trip: tripsFactory.get($stateParams.trip_id),
      }))
      .then(function(data) {
        $scope.profile = data.profile;
        $scope.trip = data.trip.data;
        $scope.segments = computeSegmentFromEvents($scope.trip.events);
        lastPosition = computeLastPositionFromEvents($scope.trip.events);
        render();
      });
    }

    function render() {
      $scope.canStopTrip = $scope.trip.owner_id === $scope.profile._id &&
        !$scope.trip.ended_date;
      $scope.trackingPosition = geoService.watching();
    }

    function computeSegmentFromEvents(events) {
      var segments = events.reduce(function(segments, event) {
        var curSegment = segments[segments.length -1];
        var previousPoint = curSegment.points[curSegment.points.length -1];

        // Non geo events are simply appended
        if('geo' !== event.contents.type.split('-')[1]) {
          curSegment.events.push(event);
          return segments;
        }

        // Geo events are merged according to elapsed time
        if(!previousPoint) {
          curSegment.points.push(event);
          return segments;
        }
        event.elapsedTime = (new Date(event.created_date)).getTime() -
          (new Date(previousPoint.created_date)).getTime();
        event.distance = geolib.getDistance({
          latitude: previousPoint.contents.geo[0],
          longitude: previousPoint.contents.geo[1],
          altitude: previousPoint.contents.geo[2],
        }, {
          latitude: event.contents.geo[0],
          longitude: event.contents.geo[1],
          altitude: event.contents.geo[2],
        });
        if(
          1 < curSegment.points.length &&
          MIN_STOP_DURATION < event.elapsedTime &&
          MIN_SPEED > event.distance / event.elapsedTime
        ) {
          segments.push({
            events: [],
            points: [event],
            distance: event.distance,
            elapsedTime: event.elapsedTime,
          });
        } else {
          curSegment.points.push(event);
          curSegment.distance += event.distance;
          curSegment.elapsedTime += event.elapsedTime;
        }
        return segments;
      }, [{
        events: [],
        points: [],
        distance: 0,
        elapsedTime: 0,
      }]);

      return segments;
    }

    function computeLastPositionFromEvents(events) {
      var lastPositionEvent;

      lastPositionEvent = events.reduce(function(event, candidateEvent) {
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
      return lastPositionEvent ? {
        latitude: lastPositionEvent,
          latitude: lastPositionEvent.contents.geo[0],
          longitude: lastPositionEvent.contents.geo[1],
          altitude: lastPositionEvent.contents.geo[2],
      } : {}.undef;
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
        sfLoadService.runState($scope, 'position', geoService.getPosition())
        .then(function(position) {
          position = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
          };
          if(positionsDiffers(position, lastPosition)) {
            return sendPositionEvent(position).then(function() {
              lastPosition = position;
            });
          }
        })
        .catch(function(err) {
          $log.error(err);
          throw err;
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

      return sfLoadService.runState($scope, 'sendposition',
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
        'trip-start': 'item-body',
        'twitter-status': 'item-avatar',
        'trip-stop': 'item-body',
        'trip-comment': 'item-avatar'
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
    'sfLoadService',
    'createObjectId', 'eventsFactory', 'toasterService',
  ];
  /* @ngInject */
  function StopTripCtrl(
    $scope, $stateParams,
    sfLoadService,
    createObjectId, eventsFactory, toasterService
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
      sfLoadService.runState($scope, 'stop',
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
    'sfLoadService',
    'createObjectId', 'eventsFactory', 'toasterService', 'authService',
  ];
  /* @ngInject */
  function CommentTripCtrl(
    $scope, $stateParams,
    sfLoadService,
    createObjectId, eventsFactory, toasterService, authService
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
      sfLoadService.runState($scope, 'comment',
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
