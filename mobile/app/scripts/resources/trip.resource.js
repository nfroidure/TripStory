(function() {
  'use strict';

  angular
    .module('app.resources')
    .factory('TripResource', TripResource);

  /* @ngInject */
  function TripResource($resource, $cacheFactory, ENV) {
    return $resource(ENV.apiEndpoint + 'api/v0/users/:user_id/trips/:trip_id', {});
  }

})();
