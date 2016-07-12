(function() {
  'use strict';

  angular
    .module('app.about')
    .controller('AboutCtrl', AboutCtrl);

  AboutCtrl.$inject = [
    '$scope',
    'ENV',
  ];
  /* @ngInject */
  function AboutCtrl(
    $scope,
    ENV
  ) {
    $scope.debug = debug;
    $scope.credits = [{
      name: 'Nicolas Froidure',
      home_url: 'https://insertafter.com',
      github_url: 'https://github.com/nfroidure',
      twitter_url: 'https://twitter.com/nfroidure',
      linkedin_url: 'https://www.linkedin.com/in/nfroidure',
    }, {
      name: 'Sébastien Elet',
      home_url: '',
      github_url: 'https://github.com/SebastienElet',
      twitter_url: 'https://twitter.com/nasga',
      linkedin_url: 'https://www.linkedin.com/in/sébastien-elet-75bb0b112',
    }, {
      name: 'Xavier Haniquaut',
      home_url: '',
      github_url: 'https://github.com/xavhan',
      twitter_url: 'https://twitter.com/xavhan',
      linkedin_url: 'https://www.linkedin.com/in/xavierhaniquaut',
    }, {
      name: 'Marc Lainez',
      home_url: '',
      github_url: 'https://github.com/mlainez',
      twitter_url: 'https://twitter.com/mlainez',
      linkedin_url: 'https://www.linkedin.com/in/marclainez',
    }, {
      name: 'Rémy Thellier',
      home_url: '',
      github_url: 'https://github.com/Remythellier',
      twitter_url: 'https://twitter.com/Remythellier',
      linkedin_url: 'https://www.linkedin.com/in/remythellier',
    }];

    function debug() {
      $scope.ENV = angular.copy(ENV);
    }
  }

})();
