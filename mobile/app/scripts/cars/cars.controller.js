(function() {
  'use strict';

  angular
    .module('app.cars')
    .controller('CarsCtrl', CarsCtrl);

  CarsCtrl.$inject = [
    '$scope', '$state', '$stateParams', '$q',
    'ENV', 'carsFactory', 'authService', 'loadService', 'toasterService',
  ];
  /* @ngInject */
  function CarsCtrl(
    $scope, $state, $stateParams, $q,
    ENV, carsFactory, authService, loadService, toasterService
  ) {
    $scope.apiEndpoint = ENV.apiEndpoint;
    $scope.cars = [];
    $scope.year = (new Date()).getFullYear();
    $scope.remove = remove;
    $scope.refresh = activate;

    activate();

    //
    function activate() {
      $q.all(loadService.loadState($scope, {
        profile: authService.getProfile(),
        cars: carsFactory.list(),
      }))
      .then(function(data) {
        $scope.profile = data.profile;
        $scope.cars = data.cars.data;
      });
    }

    function remove(id) {
      loadService.runState($scope, 'remove', carsFactory.remove(id))
      .then(function() {
        $scope.refresh();
        toasterService.show('Car removed!');
      });
    }
  }

})();
