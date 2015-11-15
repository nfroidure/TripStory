(function() {
  'use strict';

  angular
    .module('app.members')
    .factory('membersFactory', membersFactory);

  membersFactory.$inject = [];
  /* @ngInject */
  function membersFactory() {
      // will be repaced by the backend
      var data = [
        { id: 1, name: 'Nicolas', avatarPicture: 'https://placekitten.com/g/40/41' },
        { id: 2, name: 'Remy', avatarPicture: 'https://placekitten.com/g/40/39' },
        { id: 3, name: 'Xavier', avatarPicture: 'https://placekitten.com/g/39/40' },
        { id: 4, name: 'Marc', avatarPicture: 'https://placekitten.com/g/40/40' },
        { id: 5, name: 'Sebastien', avatarPicture: 'https://placekitten.com/g/40/42' },
      ];
      var service = {
        get: get,
      };

      return service;
      ////////////////
      function get(id) {
        if(id){
          return data
            .filter(function(member){ return member.id === id; })[0];
        }
        return data;
      }
  }

})();
