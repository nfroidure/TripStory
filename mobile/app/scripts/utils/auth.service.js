(function() {
  'use strict';

  angular
    .module('app.utils')
    .service('AuthService', AuthService);

  AuthService.$inject = ['$http'];
  /* @ngInject */
  function AuthService($http) {
    this.log = log;

    ////////////////
    function log(credentials) {
      return $http.post('http://localhost:3000/api/v0/login', credentials);
    }
  }

})();
