angular.module('starter').factory('GapiRiskFactorService', [ function() {

	function layerNames(riskTypeId) {
		switch (riskTypeId){
		case 1: return 'risks_pavement';
		case 2: return 'risks_traffic';
		case 3: return 'risks_geometric';
		case 4: return 'risks_roadway';
		}
	}

	function layerMarkersColor(riskTypeId) {
		switch (riskTypeId){
		case 1: return '#f00';
		case 2: return '#12a';
		case 3: return '#f70';
		case 4: return '#b0b';
		}
	}

	function addToPavementRisk($scope, lt, lg, riskType, riskId, count, rowId){
		if(lt != null && lg != null){
			var key = riskId.toString() + rowId.toString();
			$scope.risksReportMarkers[key] = {
					lat:lt, 
					lng:lg,
					layer : layerNames(riskType),
					message:  "Type: "+riskId+'<br>'+count+' Reported ',						
					icon: {type: 'makiMarker', color: layerMarkersColor(riskType)
					},
					draggable: false
			};
		}
	}

	function loadRiskReports($scope, riskTypeId){
		gapi.client.helloworldendpoints.getReportsByType({RiskType:riskTypeId}).
		execute(function (resp) {
			if (resp.error) {
				console.log(resp.error);
			} else {
				// The riskReport has succeeded.
				var i = 0; // to generate the key for markers table
				for (item in resp.items){
					i = i + 1;
					var lt = resp.items[item].Lat;
					var lg = resp.items[item].Lng;
					var riskId = resp.items[item].RiskId;
					var count = resp.items[item].Count;
					addToPavementRisk($scope, lt, lg, riskTypeId, riskId, count, i);
				}	                  
			}
		});
	}

	return loadAllRisks = function($scope){
		console.log("loadAllRisks called");
		var riskId;
		for (riskId = 1; riskId < 4; riskId++)
			loadRiskReports($scope, riskId);	
	}	
}]);