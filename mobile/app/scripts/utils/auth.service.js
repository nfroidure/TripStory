(function() {
  'use strict';

  angular
    .module('app.utils')
    .service('AuthService', AuthService);

  AuthService.$inject = ['$http'];
  /* @ngInject */
  function AuthService($http) {
    this.log = log;
    this.signup = signup;
    this.logout = logout;

    ////////////////
    function log(credentials) {
      return $http.post('http://localhost:3000/api/v0/login', credentials);
    }

    function logout(credentials) {
      return $http.post('http://localhost:3000/api/v0/logout', credentials);
    }

    function signup(credentials) {
      return $http.post('http://localhost:3000/api/v0/signup', credentials);
    }
  }

})();
