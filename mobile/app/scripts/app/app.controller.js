(function() {
  'use strict';

  angular
    .module('app')
    .controller('AppCtrl', AppCtrl);

  AppCtrl.$inject = ['$scope', '$state', '$ionicModal', '$timeout', 'tripsFactory'];
  /* @ngInject */
  function AppCtrl($scope, $state, $ionicModal, $timeout, tripsFactory) {

    $scope.loginData = {};
    $scope.trips = [];

    $scope.closeLogin = closeLogin;
    $scope.login = login;
    $scope.doLogin = doLogin;
    $scope.goToTrip = goToTrip;

    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    activate();

    //
    function activate() {
      $scope.trips = tripsFactory.get();
    }
    // Triggered in the login modal to close it
    function closeLogin() {
      $scope.modal.hide();
    }
    // Open the login modal
    function login() {
      $scope.modal.show();
    }
    // Perform the login action when the user submits the login form
    function doLogin() {
      console.log('Doing login', $scope.loginData);
      // Simulate a login delay. Remove this and replace with your login
      // code if using a login system
      $timeout(function() {
        $scope.closeLogin();
      }, 1000);
    }
    // go to related page
    function goToTrip(trip) {
      $state.go('app.single', { tripId: trip.id });
    }
  }

})();
