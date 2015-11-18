(function() {
  'use strict';

  angular
    .module('app.friends')
    .controller('FriendsCtrl', FriendsCtrl);

  FriendsCtrl.$inject = ['$scope', '$state', '$stateParams', 'friendsFactory'];
  /* @ngInject */
  function FriendsCtrl($scope, $state, $stateParams, friendsFactory) {
    // $scope.friend = friend;

    $scope.friends = [];

    activate();

    function activate() {
      friendsFactory.list()
        .then(function(friends){
          console.log('friends', friends);
          $scope.friends = friends.data;
        })
    }
  }

})();
