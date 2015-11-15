(function() {
  'use strict';

  angular
    .module('app')
    .config(Router);

  Router.$inject = ['$stateProvider', '$urlRouterProvider', '$httpProvider'];

  function Router($stateProvider, $urlRouterProvider, $httpProvider) {
    $httpProvider.defaults.withCredentials = true;
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
      })
      .state('app.member', {
        url: '/member/:memberId',
        views: {
          'menuContent': {
            templateUrl: 'templates/member.html',
            controller: 'MemberCtrl'
          }
        }
      });
    $urlRouterProvider.otherwise('/app');
  }

})();
