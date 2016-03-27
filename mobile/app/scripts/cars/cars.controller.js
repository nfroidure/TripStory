(function() {
  'use strict';

  angular
    .module('app.cars')
    .controller('CarsCtrl', CarsCtrl);

  CarsCtrl.$inject = [
    '$scope', '$state', '$stateParams', 'carsFactory', 'AuthService', 'ENV',
  ];
  /* @ngInject */
  function CarsCtrl(
    $scope, $state, $stateParams, carsFactory, AuthService, ENV
  ) {
    $scope.apiEndpoint = ENV.apiEndpoint;
    $scope.cars = [];
    $scope.year = (new Date()).getFullYear();
    $scope.state = 'loading';

    activate();

    function activate() {
      $scope.state = 'loading';
      AuthService.getProfile()
      .then(function(profile) {
        $scope.profile = profile;
      });
      carsFactory.list()
        .then(function(cars){
          $scope.cars = cars.data;
          $scope.state = 'loaded';
        })
        .catch(function(err) {
          $scope.state = 'errored';
        });
    }
  }

})();
