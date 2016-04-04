(function() {
  'use strict';

  angular
    .module('app.utils')
    .service('pusherService', PusherService);

    PusherService.$inject = [
      '$log', '$window', 'ENV',
    ];
    /* @ngInject */
    function PusherService($log, $window, ENV) {
      var pusher;

      if(!$window.Pusher) {
        return {
          subscribe: angular.noop,
        };
      }
      // Enable pusher logging - don't include this in production
      if('development' === ENV.name) {
        Pusher.log = $log.debug;
      }

      var pusher = new $window.Pusher(ENV.pusherKey, {
        appId: ENV.pusherAppId,
        cluster: ENV.pusherCluster,
        encrypted: true
      });

      return {
        subscribe: subscribe,
      };

      //
      function subscribeToChannel($scope, channel, actions) {
        var channel = pusherService.subscribe(channel);

        Object.keys(actions).forEach(function(eventName) {
          channel.bind(eventName, function() {
            actions[eventName].apply(null, arguments);
          });
          $scope.$on('$destroy', channel.unbind.bind(channel, eventName));
        });
      }
    }

  }());
