(function() {
  'use strict';

  angular
    .module('app')
    .controller('AppCtrl', AppCtrl);

  AppCtrl.$inject = ['$scope', '$state', '$ionicModal', '$timeout', 'tripsFactory', 'AuthService'];
  /* @ngInject */
  function AppCtrl($scope, $state, $ionicModal, $timeout, tripsFactory, AuthService) {

    $scope.loginData = {};
    $scope.tripToAdd = { contents: {} };
    $scope.trips = [];

    $scope.closeLogin = closeLogin;
    $scope.login = login;
    $scope.doLogin = doLogin;
    $scope.goToTrip = goToTrip;
    $scope.addTrip = addTrip;
    $scope.submitTrip = submitTrip;

    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.modal = modal;
    });

    $ionicModal.fromTemplateUrl('templates/addTripModal.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.addTripModal = modal;
    });

    activate();

    //
    function activate() {
      //$scope.trips = tripsFactory.get();
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
      console.log('Doing login with: ', $scope.loginData);
      AuthService.log($scope.loginData)
        .then(function(status) {
          if (status.status === 200) {
            $scope.closeLogin();
            $scope.me = status.data;
          }
        })
        .catch(function(err){ $scope.fail = err; });
    }
    // go to related page
    function goToTrip(trip) {
      $state.go('app.trip', { tripId: trip.id });
    }
    // add trip
    function addTrip() {
      $scope.addTripModal.show();
    }
    function submitTrip() {
      tripsFactory.post($scope.tripToAdd);
    }
  }

})();
