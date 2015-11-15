(function() {
  'use strict';

  angular
    .module('app.trips')
    .factory('tripsFactory', tripsFactory);

  tripsFactory.$inject = [];
  /* @ngInject */
  function tripsFactory() {
      var data = [
        { id: 1, label: 'Andalousie', description: 'La description du trip en Andalousie', coverPicture: 'https://placekitten.com/g/500/299' },
        { id: 2, label: 'Autriche',   description: 'La description du trip en Autriche'  , coverPicture: 'https://placekitten.com/g/500/300' },
        { id: 3, label: 'Bruxelles',  description: 'La description du trip à Bruxelles'  , coverPicture: 'https://placekitten.com/g/500/301' },
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
