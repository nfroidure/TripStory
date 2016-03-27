(function() {
  'use strict';

  angular
    .module('app.friends')
    .controller('FriendsCtrl', FriendsCtrl);

  FriendsCtrl.$inject = ['$scope', '$state', '$stateParams', 'friendsFactory'];
  /* @ngInject */
  function FriendsCtrl($scope, $state, $stateParams, friendsFactory) {
    $scope.friends = [];
    $scope.newFriend = {};
    $scope.state = 'loading';
    $scope.inviteFriend = inviteFriend;
    $scope.refresh = activate;

    activate();

    function activate() {
      $scope.state = 'loading';
      friendsFactory.list()
        .then(function(friends){
          $scope.friends = friends.data;
          $scope.state = 'loaded';
        })
        .catch(function(err) {
          $scope.state = 'errored';
        });
    }

    function inviteFriend() {
      if($scope.inviteForm.$invalid) {
        return;
      }
      $scope.fail = '';
      friendsFactory.invite($scope.newFriend)
        .then(function(response) {
          $scope.newFriend = {};
          $scope.refresh();
        })
        .catch(function(err) {
          if (0 >= err.status) {
            $scope.fail = 'E_NETWORK';
            return;
          }
          $scope.fail = err.data && err.data.code ? err.data.code : 'E_UNEXPECTED';
        });
    }
  }

})();
