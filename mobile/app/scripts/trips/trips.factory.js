(function() {
  'use strict';

  angular
    .module('app.trips')
    .factory('tripsFactory', tripsFactory);

  tripsFactory.$inject = [];
  /* @ngInject */
  function tripsFactory() {
      // will be repaced by the backend
      var data = [
        {
          id: 1,
          label: 'Andalousie',
          description: 'La description du trip en Andalousie',
          coverPicture: 'https://placekitten.com/g/500/299',
          members: [
            { id: 1, name: 'Nicolas', avatarPicture: 'https://placekitten.com/g/40/41' },
            { id: 2, name: 'Remy', avatarPicture: 'https://placekitten.com/g/40/39' },
            { id: 3, name: 'Xavier', avatarPicture: 'https://placekitten.com/g/39/40' },
          ],
        },
        {
          id: 2,
          label: 'Autriche',
          description: 'La description du trip en Autriche',
          coverPicture: 'https://placekitten.com/g/500/300',
          members: [{ id: 4, name: 'Marc', avatarPicture: 'https://placekitten.com/g/40/40' }],
        },
        {
          id: 3,
          label: 'Bruxelles',
          description: 'La description du trip à Bruxelles',
          coverPicture: 'https://placekitten.com/g/500/301',
          members: [
            { id: 5, name: 'Sebastien', avatarPicture: 'https://placekitten.com/g/40/42' },
            { id: 2, name: 'Remy', avatarPicture: 'https://placekitten.com/g/40/39' },
          ],
        },
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
