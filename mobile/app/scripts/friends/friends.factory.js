(function() {
  'use strict';

  angular
    .module('app.friends')
    .factory('friendsFactory', friendsFactory);

  friendsFactory.$inject = [
    '$http', '$q',
    'ENV', 'createObjectId', 'authService', 'analyticsService', 'loadService',
  ];
  /* @ngInject */
  function friendsFactory(
    $http, $q,
    ENV, createObjectId, authService, analyticsService, loadService
  ) {
      var service = {
        list: list,
        invite: invite,
      };

      return service;
      ////////////////

      function list() {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/friends';

          return loadService.wrapHTTPCall($http.get(url), 200);
        });
      }

      function invite(data) {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/friends';

          return loadService.wrapHTTPCall($http.post(url, data), 204)
          .then(function(response) {
            analyticsService.trackEvent('friends', 'invite', profile._id);
            return response;
          });
        });
      }
  }

})();
