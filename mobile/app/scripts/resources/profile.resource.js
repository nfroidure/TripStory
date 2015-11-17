(function() {
  'use strict';

  angular
    .module('app.resources')
    .factory('ProfileResource', ProfileResource);

  /* @ngInject */
  function ProfileResource($resource, $cacheFactory) {
    return $resource("http://localhost:3000/api/v0/profile", {});
  }

})();
