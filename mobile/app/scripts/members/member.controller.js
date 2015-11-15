(function() {
  'use strict';

  angular
    .module('app.members')
    .controller('MemberCtrl', MemberCtrl);

  MemberCtrl.$inject = ['$scope', '$stateParams', 'membersFactory'];
  /* @ngInject */
  function MemberCtrl($scope, $stateParams, membersFactory) {
    var idMember = parseInt($stateParams.memberId);

    $scope.member = {};

    activate();

    function activate() {
      $scope.member = membersFactory.get(idMember);
    }
  }

})();
