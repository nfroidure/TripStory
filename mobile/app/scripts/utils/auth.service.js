(function() {
  'use strict';

  angular
    .module('app.utils')
    .service('AuthService', AuthService);

  AuthService.$inject = ['$http', 'ENV'];
  /* @ngInject */
  function AuthService($http, ENV) {
    var apiEndPoint = ENV.apiEndpoint;
    this.log = log;
    this.signup = signup;
    this.logout = logout;

    ////////////////
    function log(credentials) {
      return $http.post(apiEndPoint + 'api/v0/login', credentials);
    }

    function logout(credentials) {
      return $http.post(apiEndPoint + 'api/v0/logout', credentials);
    }

    function signup(credentials) {
      return $http.post(apiEndPoint + 'api/v0/signup', credentials);
    }
  }

})();
