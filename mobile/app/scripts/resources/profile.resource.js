(function() {
  'use strict';

  angular
    .module('app')
    .factory('ProfileResource', ProfileResource);

  /* @ngInject */
  function ProfileResource($resource, $cacheFactory, ENV) {
    return $resource(ENV.apiEndpoint + 'api/v0/profile', {}, {
      query: { cache: false, method: 'get' }
    });
  }

})();

