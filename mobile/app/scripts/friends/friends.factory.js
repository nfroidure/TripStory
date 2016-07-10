(function() {
  'use strict';

  angular
    .module('app.friends')
    .factory('friendsFactory', friendsFactory);

  friendsFactory.$inject = [
    '$http', '$q',
    'ENV', 'createObjectId', 'authService', 'analyticsService', 'sfLoadService',
  ];
  /* @ngInject */
  function friendsFactory(
    $http, $q,
    ENV, createObjectId, authService, analyticsService, sfLoadService
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

          return sfLoadService.wrapHTTPCall($http.get(url), 200);
        });
      }

      function invite(data) {
        return authService.getProfile()
        .then(function(profile) {
          var url = ENV.apiEndpoint + '/api/v0/users/' + profile._id +
            '/friends';

          return sfLoadService.wrapHTTPCall($http.post(url, data), 204)
          .then(function(response) {
            analyticsService.trackEvent('friends', 'invite', profile._id);
            return response;
          });
        });
      }
  }

})();
