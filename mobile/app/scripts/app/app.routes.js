(function() {
  'use strict';

  angular
    .module('app')
    .config(Router);

  Router.$inject = [
    '$stateProvider', '$urlRouterProvider', '$httpProvider',
  ];

  function Router(
    $stateProvider, $urlRouterProvider, $httpProvider
  ) {
    var resolveObject = {
      gaTrackPage: gaTrackPage,
    };

    gaTrackPage.$inject = ['$q', 'analyticsService'];
    function gaTrackPage($q, analyticsService) {
      analyticsService.trackPage();
      return $q.when({});
    }

    $httpProvider.defaults.withCredentials = true;
    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'AuthCtrl',
        resolve: resolveObject,
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'templates/signup.html',
        controller: 'AuthCtrl',
        resolve: resolveObject,
      })
      .state('app', {
        url: '/app',
        cache: 'false',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'MenuCtrl'
      })
      .state('app.profile', {
        url: '/profile',
        resolve: resolveObject,
        views: {
          'menuContent': {
            templateUrl: 'templates/profile.html',
            controller: 'ProfileCtrl'
          }
        },
      })
      .state('app.destroy', {
        url: '/destroy',
        resolve: resolveObject,
        views: {
          'menuContent': {
            templateUrl: 'templates/destroy.html',
            controller: 'DestroyCtrl'
          }
        },
      })
      .state('app.cars', {
        url: '/cars',
        resolve: resolveObject,
        views: {
          'menuContent': {
            templateUrl: 'templates/cars.html',
            controller: 'CarsCtrl'
          }
        },
      })
      .state('app.friends', {
        url: '/friends',
        resolve: resolveObject,
        views: {
          'menuContent': {
            templateUrl: 'templates/friends.html',
            controller: 'FriendsCtrl'
          }
        },
      })
      .state('app.trips', {
        url: '/trips',
        resolve: resolveObject,
        views: {
          'menuContent': {
            templateUrl: 'templates/trips.html',
            controller: 'TripsCtrl'
          }
        },
      })
      .state('app.trip', {
        url: '/trip/:trip_id',
        resolve: resolveObject,
        views: {
          'menuContent': {
            templateUrl: 'templates/trip.html',
            controller: 'TripCtrl',
          },
        },
      })
      .state('app.tripMap', {
        url: '/trip/:trip_id/map',
        resolve: resolveObject,
        views: {
          'menuContent': {
            templateUrl: 'templates/map.html',
            controller: 'MapCtrl',
          },
        },
      })
      .state('app.about', {
        url: '/about',
        resolve: resolveObject,
        views: {
          'menuContent': {
            templateUrl: 'templates/about.html',
            controller: 'AboutCtrl',
          },
        },
      });
    $urlRouterProvider.otherwise('/login');
  }
})();
