(function() {
  'use strict';

  angular
    .module('app.trips')
    .controller('TripCtrl', TripCtrl)
    .controller('StopTripCtrl', StopTripCtrl)
    .controller('CommentTripCtrl', CommentTripCtrl);

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
    $scope.commentTrip = commentTrip;
    $scope.closeCommentTrip = closeCommentTrip;
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
    '$scope',
    'createObjectId', 'eventsFactory', 'loadService', 'toasterService',
  ];
  /* @ngInject */
  function StopTripCtrl(
    $scope,
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
