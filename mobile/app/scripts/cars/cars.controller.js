(function() {
  'use strict';

  angular
    .module('app.cars')
    .controller('CarsCtrl', CarsCtrl);

  CarsCtrl.$inject = [
    '$scope', '$state', '$stateParams', 'carsFactory', 'authService', 'ENV',
  ];
  /* @ngInject */
  function CarsCtrl(
    $scope, $state, $stateParams, carsFactory, authService, ENV
  ) {
    $scope.apiEndpoint = ENV.apiEndpoint;
    $scope.cars = [];
    $scope.year = (new Date()).getFullYear();
    $scope.state = 'loading';
    $scope.remove = remove;
    $scope.refresh = activate;

    activate();

    function activate() {
      $scope.state = 'loading';
      authService.getProfile()
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

    function remove(id) {
      $scope.state = 'loading';
      carsFactory.remove(id)
        .then(function() {
          $scope.refresh();
        })
        .catch(function(err) {
          $scope.state = 'errored';
        });
    }
  }

})();
