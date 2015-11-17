(function() {
  'use strict';

  angular
    .module('app.resources')
    .factory('TripResource', TripResource);

  /* @ngInject */
  function TripResource($resource, $cacheFactory) {
    return $resource("http://localhost:3000/api/v0/users/:user_id/trips/:trip_id", {});
  }

})();
