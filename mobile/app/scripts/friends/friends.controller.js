(function() {
  'use strict';

  angular
    .module('app.friends')
    .controller('FriendsCtrl', FriendsCtrl);

  FriendsCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$q',
    'loadService', 'friendsFactory',
  ];
  /* @ngInject */
  function FriendsCtrl(
    $scope, $state, $stateParams, $q,
    loadService, friendsFactory
  ) {
    $scope.friends = [];
    $scope.newFriend = {};
    $scope.inviteFriend = inviteFriend;
    $scope.refresh = activate;

    activate();

    //
    function activate() {
      $q.all(loadService.loadState($scope, {
        friends: friendsFactory.list(),
      }))
      .then(function(data) {
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
        analyticsService.trackEvent('friends', 'invite', profile._id);
      });
    }
  }

})();
