(function() {
  'use strict';

  angular
    .module('app.friends')
    .controller('FriendsCtrl', FriendsCtrl);

  FriendsCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$q',
    'loadService', 'friendsFactory', 'analyticsService', 'authService',
    'toasterService',
  ];
  /* @ngInject */
  function FriendsCtrl(
    $scope, $state, $stateParams, $q,
    loadService, friendsFactory, analyticsService, authService,
    toasterService
  ) {
    $scope.friends = [];
    $scope.newFriend = {};
    $scope.inviteFriend = inviteFriend;
    $scope.refresh = activate;

    activate();

    //
    function activate() {
      $q.all(loadService.loadState($scope, {
        profile: authService.getProfile(),
        friends: friendsFactory.list(),
      }))
      .then(function(data) {
        $scope.profile = data.profile;
        $scope.friends = data.friends.data;
      });
    }

    function inviteFriend() {
      if($scope.inviteForm.$invalid) {
        return;
      }

      return loadService.runState($scope, 'add',
        friendsFactory.invite($scope.newFriend)
      )
      .then(function() {
        $scope.refresh();
        $scope.newFriend = {};
        $scope.inviteForm.$setPristine(false);
        toasterService.show('Invite sent!');
        analyticsService.trackEvent('friends', 'invite', $scope.profile._id);
      });
    }
  }

})();
