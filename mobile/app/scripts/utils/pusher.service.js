(function() {
  'use strict';

  angular
    .module('app.utils')
    .service('pusherService', PusherService);

    PusherService.$inject = [
      'ENV', '$log',
    ];
    /* @ngInject */
    function PusherService(ENV, $log) {
      // Enable pusher logging - don't include this in production
      if('development' === ENV.name) {
        Pusher.log = $log.debug;
      }

      var pusher = new Pusher(ENV.pusherKey, {
        appId: ENV.pusherAppId,
        cluster: ENV.pusherCluster,
        encrypted: true
      });

      return pusher;
    }

  }());
