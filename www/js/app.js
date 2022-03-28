// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'leaflet-directive', 'ngCordova', 'igTruncate','chart.js', 'GoogleLoginService', 'deviceGyroscope'])

  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        window.cordova.plugins.Keyboard.disableScroll(true);
      }
      if(window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })
.config(['$ionicConfigProvider', function($ionicConfigProvider) {

    $ionicConfigProvider.tabs.position('bottom'); // other values: top

}])
  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

      .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: 'MapController'
      })
      
      .state('app.map', {
        url: "/map",
        views: {
          'menuContent' :{
            templateUrl: "templates/map.html"
          }
        }
      })
      .state('app.search', {
      url: "/search",
      views: {
        'menuContent' :{
          templateUrl: "templates/search.html"
        }
      }
    })
       
      .state('app.feedback', {
      url: "/feedback",
      views: {
        'menuContent' :{
          templateUrl: "templates/feedback.html"
        }
      }
    })
    .state('app.feedback2', {
      url: "/feedback2",
      views: {
        'menuContent' :{
          templateUrl: "templates/feedback2.html"
        }
      }
    })
    .state('app.help', {
      url: "/help",
      views: {
        'menuContent' :{
          templateUrl: "templates/help.html"
        }
      }
    })
       .state('app.altchart', {
        url: "/altchart",
        templateUrl: "templates/altchart.html",
        controller: 'MapController'
        
      })
       .state('app.disclaim', {
        url: "/disclaim",
        views: {
            'menuContent' :{
              templateUrl: "templates/disclaim.html"
            }
          }
        
      })
      
    $urlRouterProvider.otherwise('/app/map');

  });