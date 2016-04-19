(function() {
  'use strict';

  angular
    .module('app.friends')
    .factory('friendsFactory', friendsFactory);

  friendsFactory.$inject = [
    '$http', 'createObjectId', '$q',
    'ENV', 'authService', 'analyticsService', 'loadService',
  ];
  /* @ngInject */
  function friendsFactory(
    $http, createObjectId , $q,
    ENV, authService, analyticsService, loadService
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

          return loadService.wrapHTTPCall($http.post(url, data), 201)
          .then(function() {
            analyticsService.trackEvent('friends', 'invite', profile._id);
          });
        });
      }
  }

})();
