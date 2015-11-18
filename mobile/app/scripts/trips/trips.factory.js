(function() {
  'use strict';

  angular
    .module('app.trips')
    .factory('tripsFactory', tripsFactory);

  tripsFactory.$inject = ['$http', 'createObjectId', 'ProfileResource', '$q'];
  /* @ngInject */
  function tripsFactory($http, createObjectId, ProfileResource, $q) {

      var tripMock = {
        '_id': '56489f520c5e9c5a0ac454a4',
        'contents': {
          'title': 'A journey',
          'description': 'Yolo!',
          'owner_id': '564899175272cf856f678b1b',
          'from': {
            'address': '2, rue de la Haye du Temple 59000 Lille',
            'latLng': [
              0,
              0
            ]
          },
          'to': {
            'address': '72 avenue de Bretagne 59000 Lille',
            'latLng': [
              0,
              0
            ]
          },
          'hash': 'yolotrip',
          'friends_ids': [
            '5648744edd8dd13558b01635'
          ],
          'car_id': '564b2cabeec81a63aae5f4e8',
          '_id': '56489f520c5e9c5a0ac454a4'
        },
        'events': [
          {
            '_id': '56489f520c5e9c5a0ac454a4',
            'contents': {
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'trip-start',
              'date': '2015-11-15T17:19:57.198Z'
            }
          },
          {
            '_id': '564a64220c5e9c5a0ac45654',
            'contents': {
              'date': '2015-11-16T22:54:14.000Z',
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'twitter-status',
              'text': '#yolotrip #jdmc15 héhé',
              'geo': null
            }
          },
          {
            '_id': '564b57c30c5e9c5a0ac456d3',
            'contents': {
              'date': '2015-11-17T16:36:34.000Z',
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'psa-geo',
              'geo': [
                '48.78678',
                '2.33958',
                '138'
              ]
            }
          },
          {
            '_id': '564b58740c5e9c5a0ac456d6',
            'contents': {
              'date': '2015-11-17T16:37:26.000Z',
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'psa-geo',
              'geo': [
                '48.78682',
                '2.33973',
                '136'
              ]
            }
          },
          {
            '_id': '564b59050c5e9c5a0ac456d7',
            'contents': {
              'date': '2015-11-17T16:37:26.000Z',
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'psa-geo',
              'geo': [
                '48.78682',
                '2.33973',
                '136'
              ]
            }
          },
          {
            '_id': '564b59300c5e9c5a0ac456d8',
            'contents': {
              'date': '2015-11-17T16:37:26.000Z',
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'psa-geo',
              'geo': [
                '48.78682',
                '2.33973',
                '136'
              ]
            }
          },
          {
            '_id': '564b5aba0c5e9c5a0ac456d9',
            'contents': {
              'date': '2015-11-17T16:37:26.000Z',
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'psa-geo',
              'geo': [
                '48.78682',
                '2.33973',
                '136'
              ]
            }
          },
          {
            '_id': '564b71f60c5e9c5a0ac456e6',
            'contents': {
              'date': '2015-11-17T17:57:18.000Z',
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'psa-geo',
              'geo': [
                '48.78663',
                '2.33954',
                '124'
              ]
            }
          },
          {
            '_id': '564b8fed0c5e9c5a0ac45732',
            'contents': {
              'date': '2015-11-17T20:35:47.000Z',
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'psa-geo',
              'geo': [
                '48.79117',
                '2.34246',
                '155'
              ]
            }
          },
          {
            '_id': '564b90210c5e9c5a0ac45734',
            'contents': {
              'date': '2015-11-17T20:36:46.000Z',
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'psa-geo',
              'geo': [
                '48.79496',
                '2.34167',
                '122'
              ]
            }
          },
          {
            '_id': '564b90740c5e9c5a0ac45735',
            'contents': {
              'date': '2015-11-17T20:37:52.000Z',
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'psa-geo',
              'geo': [
                '48.79728',
                '2.34231',
                '134'
              ]
            }
          },
          {
            '_id': '564b91540c5e9c5a0ac45736',
            'contents': {
              'date': '2015-11-17T20:39:14.000Z',
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'psa-geo',
              'geo': [
                '48.79558',
                '2.34203',
                '176'
              ]
            }
          },
          {
            '_id': '56489f520c5e9c5a2ac454a4',
            'contents': {
              'trip_id': '56489f520c5e9c5a0ac454a4',
              'type': 'trip-stop',
              'date': '2015-11-15T17:21:00.198Z'
            }
          },
        ]
      };

      var service = {
        get: get,
        post: post,
      };

      return service;
      ////////////////

      function get(idTrip) {
        // Mock for designing
        if(idTrip){
          return tripMock;
        }
        ProfileResource.get().$promise
          .then(function(profile){
            var url = 'http://stripstory.lol/api/v0/users/' + profile._id + '/trips';
            if(idTrip){
              url += idTrip;
            }
            return $http.get(url);
          });
      }
      function post(trip) {
        return $http.post('https://stripstory.lol/api/v0/trips/' + createObjectId(), trip);
      }
  }

})();
