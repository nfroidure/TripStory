(function() {
  'use strict';

  angular
    .module('app.trips', [
      'angularMoment',
      'app.authentication', 'app.friends', 'app.cars', 'app.events', 'app.utils',
    ]);

}());
