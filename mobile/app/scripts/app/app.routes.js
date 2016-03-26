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
        controller: 'MenuCtrl',
      })
      .state('app.profile', {
        url: '/profile',
        views: {
          'menuContent': {
            templateUrl: 'templates/profile.html',
            controller: 'ProfileCtrl'
          }
        },
      })
      .state('app.destroy', {
        url: '/destroy',
        views: {
          'menuContent': {
            templateUrl: 'templates/destroy.html',
            controller: 'DestroyCtrl'
          }
        },
      })
      .state('app.cars', {
        url: '/cars',
        views: {
          'menuContent': {
            templateUrl: 'templates/cars.html',
            controller: 'CarsCtrl'
          }
        },
      })
      .state('app.friends', {
        url: '/friends',
        views: {
          'menuContent': {
            templateUrl: 'templates/friends.html',
            controller: 'FriendsCtrl'
          }
        },
      })
      .state('app.trips', {
        url: '/trips',
        views: {
          'menuContent': {
            templateUrl: 'templates/trips.html',
            controller: 'TripsCtrl'
          }
        },
      })
      .state('app.trip', {
        url: '/trip/:trip_id',
        views: {
          'menuContent': {
            templateUrl: 'templates/trip.html',
            controller: 'TripCtrl',
          },
        },
      })
      .state('app.tripMap', {
        url: '/trip/:trip_id/map',
        views: {
          'menuContent': {
            templateUrl: 'templates/map.html',
            controller: 'MapCtrl',
          },
        },
      });
    $urlRouterProvider.otherwise('/login');
  }
})();
