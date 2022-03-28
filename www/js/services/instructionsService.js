angular.module('starter').factory('InstructionsService', [ function() {

  var instructionsObj = {};

  instructionsObj.instructions = {
    newLocations : {
      text : 'To report a risk, tap and hold on the map',
      templateUrl: '<a href="#/app/help"></a>',
      seen : false
    }
  };

  return instructionsObj;

}]);