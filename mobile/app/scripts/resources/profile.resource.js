(function() {
  'use strict';

  angular
    .module('app.resources')
    .factory('ProfileResource', ProfileResource);

  /* @ngInject */
  function ProfileResource($resource, $cacheFactory) {
    return $resource("https://stripstory.lol/api/v0/profile", {}, {
      query: { cache: false, method: 'get' }
    });
  }

})();

