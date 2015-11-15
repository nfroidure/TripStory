(function() {
  'use strict';

  angular
    .module('starter')
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
        getOne: getOne,
        setOne: setOne,
      };

      return service;
      ////////////////
      function get() {
        return data;
      }
      function getOne(id) {
        return data
          .filter(function(trip){ return trip.id === id; });
      }
      function setOne() {
        console.log('hello');
      }
  }

})();
