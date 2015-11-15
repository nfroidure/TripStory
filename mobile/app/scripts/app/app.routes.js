(function() {
  'use strict';

  angular
    .module('app')
    .config(Router);

  Router.$inject = ['$stateProvider', '$urlRouterProvider'];

  function Router($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
      })
      .state('app.splash', {
        url: '',
        views: {
          'menuContent': {
            templateUrl: 'templates/splash.html',
          }
        }
      })
      .state('app.trip', {
        url: '/trips/:tripId',
        views: {
          'menuContent': {
            templateUrl: 'templates/trip.html',
            controller: 'TripCtrl'
          }
        }
      });
    $urlRouterProvider.otherwise('/app');
  }

})();
