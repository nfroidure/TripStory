(function() {
  'use strict';

  angular
    .module('app.friends')
    .controller('FriendsCtrl', FriendsCtrl);

  FriendsCtrl.$inject = ['$scope', '$state', '$stateParams', 'friendsFactory'];
  /* @ngInject */
  function FriendsCtrl($scope, $state, $stateParams, friendsFactory) {
    $scope.friends = [];
    $scope.state = 'loading';

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
  }

})();
