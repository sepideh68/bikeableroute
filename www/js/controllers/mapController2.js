angular.module('starter').controller('MapController',
		[ '$scope',
		  /*'$cordovaGeolocation',*/
		  '$stateParams',
		  '$ionicModal',
		  '$ionicPopup',
		  '$ionicSideMenuDelegate',
		  '$window', '$cordovaDevice',
		  'LocationsService',
		  'MenuServices',
		  'InstructionsService',
		  'ImgSlideService',
		  'GapiRiskFactorService',
		  function(
				  $scope,
				 /* $cordovaGeolocation,*/
				  $stateParams,
				  $ionicModal,
				  $ionicPopup,
				  $ionicSideMenuDelegate,
				  $window, $cordovaDevice,
				  LocationsService,
				  MenuServices,
				  InstructionsService,
				  ImgSlideService,
				  GapiRiskFactorService
		  ) {

			$scope.sideMenu;
			$scope.recordedPaths = {
					path: {
						type: "polyline",
						color: "red",
						weight: "5",
						strokeOpacity: "0.7",
						latlngs: []
					},
					recTrack:{
						type: "polyline",
						color: "blue",
						weight: "5",
						strokeOpacity: "0.7",
						latlngs: []
					}
			}
			
		    $scope.labels = [];
		    $scope.data = [
		                   [] ];
		    
		    function distance(lat1, lon1, lat2, lon2){
		    	var radlat1 = Math.PI * lat1/180;
		    	var radlat2 = Math.PI * lat2/180;
		    	var radlon1 = Math.PI * lon1/180;
		    	var radlon2 = Math.PI * lon2/180;
		    	var theta = lon1-lon2;
		    	var radtheta = Math.PI * theta/180;
		    	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		    	dist = Math.acos(dist);
		    	dist = dist * 180/Math.PI;
		    	dist = dist * 60 * 1.1515;
		        dist = dist * 1.609344 ;
		    	return dist;
		    }
            $scope.say = function(mytext){
    			var u = new SpeechSynthesisUtterance();
                u.text = mytext;
                u.lang = 'en-US';
                u.rate = 0.5;
                speechSynthesis.speak(u);
                }
		    
			
			function addToPath(lt, lg){
				$scope.recordedPaths['path'].latlngs.push(
						{lat:lt, lng:lg});
			}	 

			function addToRecTrack(lt, lg){
				$scope.recordedPaths['recTrack'].latlngs.push(
						{lat:lt, lng:lg});
			}

			$scope.risksReportMarkers = {};

			function loadTrack(trackid){
				gapi.client.helloworldendpoints.getUserTrack({userName:$scope.uuid, trackId:trackid}).
				execute(function (resp) {
					if (resp.error) {
						alert(resp.error.message);
					} else {
						$scope.recordedPaths['recTrack'].latlngs = [];
						var altitudeUser = [];
						var chartdist = [];
						var lastlat = 0;
						var lastlng = 0;
						for (item in resp.items){
							var lt = resp.items[item].Lat;
							var lg = resp.items[item].Lng;
							var alt = resp.items[item].Alt;
							var rndist;
							addToRecTrack(lt, lg);
							var y = alt.toFixed(2);
							altitudeUser.push(y);
							rndist = distance (lastlat, lastlng, lt, lg);
							var x = (rndist*0.000621371192).toFixed(1);
							chartdist.push(x);
							lastlat = lt ; 
							lastlng = lg;
						}
						if (chartdist.length > 0){
							altitudeUser.splice(0,1);
							chartdist.splice(0,1);
						}
						$scope.data[0] = altitudeUser;
						$scope.labels = chartdist;
						$scope.map.center.lat  = resp.items[0].Lat - 0.1;
						$scope.map.center.lng = resp.items[0].Lng ;
						$scope.map.center.zoom = 11;
					}

				});
			}

			 function makeGroup(risklayer) {
			      return {
			        iconCreateFunction: function(cluster) {var childCount = cluster.getChildCount();

                   var c = ' marker-cluster-'+risklayer;
                   return new L.DivIcon({ html: '<div><span>' + childCount +
                   	'</span></div>', className: 'marker-cluster' + c, iconSize: new L.Point(40, 40) });

			        }
			      };
			    }
			/**
			 * Once state loaded, get put map on scope.
			 */
			$scope.$on("$stateChangeSuccess", function() {
				$scope.locations = LocationsService.savedLocations;
				$scope.newLocation;

				if(!InstructionsService.instructions.newLocations.seen) {

					var instructionsPopup = $ionicPopup.alert({
						title: 'Add Risks',
						template: InstructionsService.instructions.newLocations.text
					});
					instructionsPopup.then(function(res) {
						InstructionsService.instructions.newLocations.seen = true;
					});

				}

				$scope.riskLayers = {
						baselayers: {
							xyz: {
								name: 'OpenStreetMap',
								url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
								type: 'xyz',
								
								layerOptions: {
								
	                                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href=" http://labs.strava.com/heatmap">Strava heatmap</a>',
	                                showOnSelector: false,
	                                continuousWorld: false
								}
				             }
						},
						overlays: {
							strava: {
								name: '<img src="img/maki-preview-24.png">'+'Strava cycling',
								type: 'xyz',
								url: 'http://globalheat.strava.com/tiles/cycling/color3/{z}/{x}/{y}.png',
								visible: true

							},

							risks_pavement: {
								name:'<img src="img/1.png">'+'Infrastructure',
								layerOptions:makeGroup('pavement'),
								type: 'markercluster',
								visible: false,
							
							},
							risks_traffic: {
								name: '<img src="img/2.png">'+'Traffic',
								layerOptions:makeGroup('traffic'),
								type: 'markercluster',
								visible: false
							},
							risks_geometric: {
								name: '<img src="img/3.png">'+'Facility',
								layerOptions:makeGroup('geometric'),
								type: 'markercluster',
								visible: false
							}, 
//							risks_roadway: {
//								name: '<img src="img/4.png">'+'Roadway',
//								layerOptions:makeGroup('roadway'),
//								type: 'markercluster',
//								visible: false
//							}
						}
				}

				$scope.map = {
						defaults: {
							tileLayer: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
							maxZoom: 18,
							zoomControlPosition: 'topleft',

						},
						markers : {},
						events: {
							map: {
								enable: ['context', 'focus'],
								logic: 'emit'
							}
						}
				};

				$scope.map.center  = {
						lat : 0,
						lng : 0,
						zoom : 15,
						icon: {
							type: 'makiMarker', 
							color: '0f0'
						}
				};
				$scope.locate3();        

			});
//			check if code below is useful
			var Location = function() {
				if ( !(this instanceof Location) ) return new Location();
				this.lat  = "";
				this.lng  = "";
				this.name = "";
			};


			$ionicModal.fromTemplateUrl('templates/addLocation.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				$scope.modal = modal;
			});
			 $scope.openModal = function() {
				    $scope.modal.show();
				  };
				  $scope.closeModal = function() {
				    $scope.modal.hide();
				  };
				  $scope.$on('$destroy', function() {
					    $scope.modal.remove();
					  });
		    $scope.$on('leafletDirectiveMap.focus', function(event, args){
		    	loadAllRisks($scope);
		    });
		    
			/**
			 * Detect user long-pressing on map to add new location
			 */
			$scope.$on('leafletDirectiveMap.contextmenu', function(event, locationEvent){
				$scope.newLocation = new Location();
				$scope.newLocation.lat = locationEvent.leafletEvent.latlng.lat;
				$scope.newLocation.lng = locationEvent.leafletEvent.latlng.lng;     
				$scope.modal.show();
			});

			$scope.saveLocation = function() {
				$scope.newLocation.name = $scope.selectedItem.title;
				$scope.newLocation.type = $scope.selectedItem.type;
				LocationsService.savedLocations.push($scope.newLocation);
				$scope.modal.hide();
				$scope.goTo(LocationsService.savedLocations.length - 1);
			};

			/**
			 * Center map on specific saved location
			 * @param locationKey
			 */
			$scope.goTo = function(locationKey) {

				var location = LocationsService.savedLocations[locationKey];

				$scope.map.center  = {
						lat : location.lat,
						lng : location.lng,
						zoom : 12
				};
				
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
					case 1: return 'f00';
					case 2: return '12a';
					case 3: return 'f70';
					case 4: return 'b0b';
					}
				}
				$scope.risksReportMarkers[locationKey] = {
						lat:location.lat,
						lng:location.lng,
						message: "Type "+location.name,
						layer : layerNames(location.type),
						icon: {
							type: 'makiMarker', 
							color: layerMarkersColor(location.type)
						},
						focus: true,
						draggable: false
				};

			};
			$scope.locate3 = function(){
				if (navigator.geolocation){
				var	optn= {
							enableHighAccuracy : true,
							timeout : Infinity,
							maximumAge : 0
					}
					navigator.geolocation.getCurrentPosition(showPosition3, showError, optn);
				} else {
						alert('Geolocation is not supported in your browser');
				}
				}
			function showPosition3(position){
				$scope.map.center.lat  = position.coords.latitude;
				$scope.map.center.lng = position.coords.longitude;
				$scope.map.center.zoom = 15;
			}
			/**
			 * Center map on user's current position
			 */
			$scope.locate = function(){
				if (navigator.geolocation){
				var	optn= {
							enableHighAccuracy : true,
							timeout : Infinity,
							maximumAge : 0
					}
					navigator.geolocation.getCurrentPosition(showPosition, showError, optn);
				} else {
						alert('Geolocation is not supported in your browser');
				}
				}
			function showPosition(position){
				$scope.map.center.lat  = position.coords.latitude;
				$scope.map.center.lng = position.coords.longitude;
				$scope.map.center.zoom = 15;
	            $scope.risksReportMarkers.now = {
	                    lat:position.coords.latitude,
	                    lng:position.coords.longitude,
	                    icon: {
	    						type: 'makiMarker', 
	    						color: '0f0'
	    					},
	                    message: "You Are Here",
	                    draggable: false
	                  };

			}
			function showError(error) {
				// error
				switch(error.code) {
				case error.PERMISSION_DENIED:
					alert("User denied the request for Geolocation.");
					break;
				case error.POSITION_UNAVAILABLE:
					alert("Location information is unavailable.");
					break;
				case error.TIMEOUT:
					alert("The request to get user location timed out.");
					break;
				case error.UNKNOWN_ERROR:
					alert("An unknown error occurred.");
					break;
			}
			}
			
			$scope.menuClick = function (mainMenu, id1){
				if(mainMenu == "Recorded Tracks")
				{
					var trid = MenuServices[1].menuItems[id1].trackId;
					loadTrack(trid);
					loadAltChart();
				}
			}      
			function loadAltChart(){
				$scope.modal2.show();
			}
			$ionicModal.fromTemplateUrl('templates/altchart.html', {
			    scope: $scope,
			    viewType: 'bottom-sheet',
			    animation: 'slide-in-up'
			  }).then(function(modal) {
			    $scope.modal2 = modal;
			  });
			
			$scope.showSettings = function() {
				$scope.MenuTitle = MenuServices[0].MenuTitle;
				$scope.sideMenu = MenuServices[0].menuItems;  

			}

			$scope.showTrackHistory = function() {
				//MenuServices[1]();
				$scope.MenuTitle = MenuServices[1].MenuTitle;;
				$scope.sideMenu = MenuServices[1].menuItems;
				
			}

			$scope.imageSlides = ImgSlideService.countPM;
			$scope.imageSlides2 = ImgSlideService.countTR;
			$scope.imageSlides3 = ImgSlideService.countGD;
		//	$scope.imageSlides4 = ImgSlideService.countRM;


			function deviceInit() {
				console.log("initializing device");
				try {
					$scope.uuid = $cordovaDevice.getUUID();
					//alert('user id is: ' + $scope.uuid);

				}
				catch (err) {
					$scope.uuid = "guest";
					console.log("Error " + err.message);
				}
			}

			ionic.Platform.ready(function(){
				deviceInit();
				//loadAllRisks($scope);				
			});

			$scope.dev_width = $window.innerWidth;
			$scope.dev_height = $window.innerHeight;

			var i = 0;
			var latlngs = [];
			var lat_1 ;
			var lng_1;
			var spp_1 = 0;
			var dist;
			var duration = getCurrentTime();
			var trackid_1;
			var userid_1 = $scope.uuid;
			var date_1;
			var myTimer;
			var timerStarted = false;
			var maximumZoom = 15;
			
			var lastLat = 0; // to get the last position of user
			var lastLng = 0;	//to get the last position of user
			var watchId;
			$scope.started = false;
			
			function locate2(){
				if (navigator.geolocation){
				var	optn2= {
							enableHighAccuracy : true,
							timeout : Infinity,
							maximumAge : 0
					}
				watchId = navigator.geolocation.watchPosition(showPosition2, showError2, optn2);
				}
				else {
						alert('Geolocation is not supported in your browser');
				}
			}
			
			function showPosition2(position){
				lat_1  = position.coords.latitude;
				lng_1 = position.coords.longitude;
				var alti = position.coords.altitude;
				if (alti == null){alti = 0;}
				spp_1 = (spp_1 + position.coords.speed)/2;
				
				$scope.risksReportMarkers.now = {
							lat:position.coords.latitude,
							lng:position.coords.longitude, 
							icon: {
								type: 'makiMarker', 
	    						color: '06f',
	    						
							iconSize:     [16, 16]
					}
				
			};
				addToPath(position.coords.latitude, position.coords.longitude);				
				var date_1 = getSysDate();
				storeTrack(trackid_1, $scope.uuid, date_1, lat_1, lng_1, alti);
			}
			
			function showError2(error) {
				// error
				switch(error.code) {
				case error.PERMISSION_DENIED:
					alert("User denied the request for Geolocation.");
					break;
				case error.POSITION_UNAVAILABLE:
					alert("Location information is unavailable.");
					break;
				case error.TIMEOUT:
					alert("The request to get user location timed out.");
					break;
				case error.UNKNOWN_ERROR:
					alert("An unknown error occurred.");
					break;
			}
			}
			function stopWatch() {
					if (watchId) {
						navigator.geolocation.clearWatch(watchId);
						watchId = null;
					}
			}	
			
			function getCurrentTime(){
				var d = new Date(); // for now
				return d.getSeconds()+d.getMinutes()*60 +d.getHours()*3600;
			}
			$scope.start = function start(){
				
				$scope.started = !$scope.started;
				if($scope.started){
				$scope.say('start tracking.');
				$scope.recordedPaths['path'].latlngs=[];
				timerStarted = true;
				duration = getCurrentTime();
				getNextTrackId(function(id)
						{trackid_1=  id;});
				locate2();
				}
				else 
					stop();
			}
			function stop() {
				$scope.say('tracking is stopped.');
				stopWatch();
				timerStarted = false;
				var finishTime = getCurrentTime();// to get current time when stopped in second
				duration = finishTime - duration;// time duration of tracking
				
			    dist = (spp_1 * duration); // the estimate distance between two point
				if (trackid_1 != null){
					updateAlt (trackid_1, duration, dist, spp_1);
					MenuServices[2](); // showDynamicTracksMenu()
				}
				trackid_1 = null;
			}

			
			function checkConnection() { 
			    var networkState = navigator.connection.type;
			    
			    var states = {};
		        states[Connection.UNKNOWN]  = 'Unknown connection';
		        states[Connection.ETHERNET] = 'Ethernet connection';
		        states[Connection.WIFI]     = 'WiFi connection';
		        states[Connection.CELL_2G]  = 'Cell 2G connection';
		        states[Connection.CELL_3G]  = 'Cell 3G connection';
		        states[Connection.CELL_4G]  = 'Cell 4G connection';
		        states[Connection.CELL]     = 'Cell generic connection';
		        states[Connection.NONE]     = 'No network connection';
			   // alert('Connection type: ' + states[networkState]);
			    return states[networkState];
			    
			}
			
			// send the tracks table to GAE datastore every 60s
			setInterval(function(){
		   var conn = checkConnection();
		   //alert (conn);
		   if(conn == 'WiFi connection' || conn == 'Unknown connection'|| conn == 'Cell generic connection'){
				db.transaction(function (tx) {
					var result;	
					var transfered = 0;
					tx.executeSql("SELECT * FROM tracks;", [], function(tx, rs){
						for(var i=0; i<rs.rows.length; i++) {
							var row = rs.rows.item(i);
							result = { 'TrackId': row['TrackId'],
									'Name': row['UserId'],
									'DateTime': row['date'],
									'Lat': row['lat'],
									'Lng': row['lng'],
									'Alt': row['alt']
							};

							gapi.client.helloworldendpoints.saveTrack(result).
							execute(function (resp) {
								if (resp.error) {
									// The request has failed.

									//alert(resp.error.message);
								} else {
									// The request has succeeded.
									
								}

							});
						}
					
						
					});
					
				tx.executeSql('Delete From tracks');
					
				});
				
				db.transaction(function (tx) {
					var result;	
					tx.executeSql("SELECT * FROM reportrisk;", [], function(tx, rs){
						for(var i=0; i<rs.rows.length; i++) {
							var row = rs.rows.item(i);
							result = { 'Track_Id': row['TrackId'],
									'User_Name': row['UserId'],
									'Risk_Id':row['riskId'],
									'RiskType' :row['riskType'],
									'RiskValue':row['Value'],
									'Date_Time': row['date'],
									'Latitude': row['lat'],
									'Longitude': row['lng']
							};							

							gapi.client.helloworldendpoints.saveReport(result).
							execute(function (resp) {
								if (resp.error) {
									// The request has failed.
									//alert(resp.error.message);
								} else {
									// The request has succeeded.
									tx.executeSql('Delete From reportrisk');
								}

							});
						}
						
					});
				});
		   }
			},1000*30);

			function getSysDate(){
				var currentTime= new Date();
				var hours = currentTime.getHours();
				if (hours<10){
					hours = '0'+hours;
				}
				var minutes = currentTime.getMinutes();
				if (minutes<10){
					minutes = '0'+minutes;
				}
				var seconds = currentTime.getSeconds();
				if (seconds<10){
					seconds = '0'+seconds;
				}
				var month = currentTime.getMonth() + 1;
				var day = currentTime.getDate();
				var year = currentTime.getFullYear();
				var t1 = hours +":"+minutes+":"+seconds;
				var d = year+"-"+month+"-"+day;
				var dateTime= d+" "+t1;

				return  dateTime;
			}

		
			
			var date_1 = getSysDate();
						
			
			$scope.selectedItem = {};
			
			$scope.report = function submitreport(){
			if (confirm('Are you sure you want to send report?')) {
				var val = $scope.selectedItem.value;
				var ty = $scope.selectedItem.type;
				var id = $scope.selectedItem.title;
				
				var lt = $scope.newLocation.lat;
				var lg = $scope.newLocation.lng;
				var tid = (trackid_1==null)? 0:trackid_1;
				
				var dtt = getSysDate();
				
				storeReport(tid, $scope.uuid, id, ty, val, dtt, lt, lg);
				$scope.saveLocation();
			}
			}
			$scope.rangeChange = function(item){
				$scope.selectedItem = item;
			}
			 $scope.trash = function trash(id){
				 if (confirm('Are you sure you want to delete?')) {
					 var trid = MenuServices[1].menuItems[id].trackId;
					  deleteTrack(trid);
					  MenuServices[1].menuItems.splice(id, 1);
					} else {
					    // Do nothing!
					}
				  
			  }
			  $scope.groups = [];

			  for (var i=0; i<10; i++) {
			    $scope.groups[i] = {
			      name: i,
			      items: []
			    };
			    for (var j=0; j<2; j++) {
			      $scope.groups[i].items.push(i + '-' + j);
			    }
			  }
			  
			  /*
			   * if given group is the selected group, deselect it
			   * else, select the given group
			   */
			  $scope.toggleGroup = function(group) {
			    if ($scope.isGroupShown(group)) {
			      $scope.shownGroup = null;
			    } else {
			      $scope.shownGroup = group;
			    }
			  };
			  $scope.isGroupShown = function(group) {
			    return $scope.shownGroup === group;
			  };
		}])
.directive('ionBottomSheet', [function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      controller: [function() {}],
      template: '<div class="modal-wrapper" ng-transclude></div>'  
    };
  }])
.directive('ionBottomSheetView', function() {
  return {
    restrict: 'E',
    compile: function(element) {
      element.addClass('bottom-sheet modal');
    }
  };
  
 
});
