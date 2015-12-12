(function() {
  'use strict';

  angular
    .module('app.cars')
    .controller('CarsCtrl', CarsCtrl);

  CarsCtrl.$inject = ['$scope', '$state', '$stateParams', 'carsFactory'];
  /* @ngInject */
  function CarsCtrl($scope, $state, $stateParams, carsFactory) {
    $scope.cars = [];
    $scope.state = 'loading';

    activate();

    function activate() {
      $scope.state = 'loading';
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
