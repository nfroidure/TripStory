(function() {
  'use strict';

  angular
    .module('app.cars')
    .controller('CarsCtrl', CarsCtrl);

  CarsCtrl.$inject = ['$scope', '$state', '$stateParams', 'carsFactory'];
  /* @ngInject */
  function CarsCtrl($scope, $state, $stateParams, carsFactory) {
    // $scope.car = car;

    $scope.cars = [];

    activate();

    function activate() {
      carsFactory.list()
        .then(function(cars){
          console.log('cars', cars);
          $scope.cars = cars.data;
        })
    }
  }

})();
