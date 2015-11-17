(function() {
  'use strict';

  angular
    .module('app')
    .config(Router);

  Router.$inject = ['$stateProvider', '$urlRouterProvider', '$httpProvider'];

  function Router($stateProvider, $urlRouterProvider, $httpProvider) {
    $httpProvider.defaults.withCredentials = true;
    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'AuthCtrl'
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'templates/signup.html',
        controller: 'AuthCtrl'
      })
      .state('app', {
        url: '/app',
        cache: 'false',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl',
        resolve: {
          profile: function(ProfileResource){
            return ProfileResource.get().$promise;
          }
        }
      })
      .state('app.trips', {
        url: '/trips',
        views: {
          'menuContent': {
            templateUrl: 'templates/trips.html',
            controller: 'TripCtrl'
          }
        }
      })
      .state('app.trip', {
        url: '/trip',
        views: {
          'menuContent': {
            templateUrl: 'templates/trip.html',
            controller: 'TripCtrl'
          }
        }
      });
    $urlRouterProvider.otherwise('/login');
  }
})();
