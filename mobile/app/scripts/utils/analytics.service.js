(function(injected, initialized) {
  'use strict';

  var scriptContent =
  "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){" +
  "  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o)," +
  "  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)" +
  "  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');";

  angular
    .module('app.utils')
    .service('analyticsService', AnalyticsService);

  AnalyticsService.$inject = [
    '$window', '$q', '$location', '$timeout', 'ENV',
  ];
  /* @ngInject */
  function AnalyticsService($window, $q, $location, $timeout, ENV) {
    var analyticsService = {};
    var deferred = $q.defer();
    var scriptElement = $window.document.createElement('script');

    // Inject the script
    scriptElement.appendChild($window.document.createTextNode(scriptContent));
    ($window.document.body).appendChild(scriptElement);
    $timeout(initAnalytics, 0);

    // setting methods
    analyticsService.trackEvent = analyticsServiceTrackEvent;
    analyticsService.trackPage = analyticsServiceTrackPage;

    return analyticsService;

    //

    function analyticsServiceTrackEvent(eventCategory, eventAction, eventLabel, eventCount, beacon) {
      return deferred.promise.then(function() {
        $window.ga(
          'send',
          'event',
          eventCategory,
          eventAction,
          eventLabel,
          eventCount, {
            useBeacon: !!beacon
          }
        );
      });
    }

    function analyticsServiceTrackPage() {
      return deferred.promise.then(function() {
        $window.ga('send', 'pageview', {
          url: $location.url(),
        });
      });
    }

    function initAnalytics() {
      if(!$window.ga) {
        deferred.reject();
      }
      $window.ga('create', ENV.analyticsAppId, ENV.analyticsAppTracker);
      if('development' !== ENV.name) {
        $window.ga('set', 'forceSSL', true);
      }
      deferred.resolve();
    }

  }

}());
