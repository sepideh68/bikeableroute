angular.module('starter').factory('LocationsService', [ function() {

  var locationsObj = {};

  locationsObj.savedLocations = [
    {
      name : "Kalamazoo, MI USA",
      type : 0,
      lat : 42.2791100,
      lng : -85.6513700
    }
  ];

  return locationsObj;

}]);