(function() {
  'use strict';

  angular
    .module('app.trips', [
      'angularMoment', 'sf.load',
      'app.authentication', 'app.friends', 'app.cars', 'app.events',
      'app.utils',
    ]);

}());
