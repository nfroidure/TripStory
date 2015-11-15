(function() {
  'use strict';

  angular
    .module('app.trips')
    .factory('tripsFactory', tripsFactory);

  tripsFactory.$inject = [];
  /* @ngInject */
  function tripsFactory() {
      var data = [
        { id: 1, label: 'Andalousie' },
        { id: 2, label: 'Autriche' },
        { id: 3, label: 'Bruxelles' },
      ];
      var service = {
        get: get,
      };

      return service;
      ////////////////
      function get(id) {
        if(id){
          return data
            .filter(function(trip){ return trip.id === id; })[0];
        }
        return data;
      }
  }

})();
