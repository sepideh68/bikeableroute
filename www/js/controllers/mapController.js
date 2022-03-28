var app=angular.module('starter').controller('MapController',
		[ '$scope',
		  '$cordovaGeolocation',
		  '$stateParams',		  
		  '$ionicModal',
		  '$ionicPopup',
		  '$ionicPlatform',
		  '$ionicSideMenuDelegate',
		  '$window', '$cordovaDevice',
		  '$deviceGyroscope',
//		  'backgroundLocationServices',
		  'LocationsService',
		  'MenuServices',
		  'InstructionsService',
		  'ImgSlideService',
		  'GapiRiskFactorService',
		  'googleLogin',
		  '$interval',
		  function(
				$scope,
				 $cordovaGeolocation,
				  $stateParams,
				  $ionicModal,
				  $ionicPopup,
				  $ionicPlatform, 
				  $ionicSideMenuDelegate,
				  $window, $cordovaDevice,
				  $deviceGyroscope,
//				  backgroundLocationServices,
				  LocationsService,
				  MenuServices,
				  InstructionsService,
				  ImgSlideService,
				  GapiRiskFactorService,
				  googleLogin,
				  $interval				  
		  ) {
			var bgLocationServices;
			var bgLocationServicesTraffic;
			var counter = 0;
			var isOnline;
			var i = 0;
			var latlngs = [];
			var accel_x;
			var accel_y;
			var accel_z;
			var gyro_x = 0;
			var gyro_y = 0;
			var gyro_z = 0;
			var promise;
			var Timestamp;
			var Timestampgyro;
			var lat_1 ;
			var lng_1;
			var alti;
			//var spp_1 = 0;
			var spp_1 = [];
			var dist;
			var duration = getCurrentTime();
			var trackid_1;
			var pointId;
			var userid_1 = $scope.uuid;
			var date_1;
			var myTimer;
			var maximumZoom = 15;
			var convertedSpd;
			var lastLat = 0; // to get the last position of user
			var lastLng = 0;	//to get the last position of user
			var lastTimeStamp = 0; // to get the last non repeating position
			var watchId;
			var watchIDAcc;
			var placeId;
			var highwayTag;
			var highwayValue;
			var txt;
			var txt2;
			var highwayValueRisk;
			var placeIdforRisk;
			var highwayForRisk;
		
			

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
                u.rate = 0.9;
                speechSynthesis.speak(u);
                }
		    
			
			function addToPath(lt, lg){
				$scope.$apply(function(){
					$scope.recordedPaths['path'].latlngs.push(
							{lat:lt, lng:lg});
				});
				
			}	 

			function addToRecTrack(lt, lg){
				$scope.recordedPaths['recTrack'].latlngs.push(
						{lat:lt, lng:lg});
			}

			angular.extend($scope, {
				risksReportMarkers : {}
			});

			function loadTrack(trackid){
				gapi.client.helloworldendpoints.getUserTrack({userName:$scope.uuid, trackId:trackid}).
				execute(function (resp) {
					if (resp.error) {
						//alert(resp.error.message);
					} else {
						$scope.recordedPaths['recTrack'].latlngs = [];
						var altitudeUser = [];
						var chartdist = [];
						var lastlat = 0;
						var lastlng = 0;
					    var i = 0;
					    var counter = Math.round(resp.items.length/10);
					    if (counter == 0){
					    	counter = 1;
					    }
					    if(resp.items.length > 0){
						    lastlat = resp.items[0].Lat;
						    lastlng = resp.items[0].Lng;
					    }
						for (item in resp.items){
							var lt = resp.items[item].Lat;
							var lg = resp.items[item].Lng;
							var alt = resp.items[item].Alt;
							var rndist = 0;
							addToRecTrack(lt, lg);
							if (i % counter == 0){							
								var y = alt.toFixed(2);
								altitudeUser.push(y);
								//if(lastLat != 0 && lastLng != 0)
									rndist = distance (lastlat, lastlng, lt, lg);
								//var x = (rndist*0.000621371192).toFixed(1);
								var x = (rndist*1000); // to meter
								x = rndist;
								//chartdist.push(x); // was x
								chartdist.push(i); // was x
							}
							i+=1;
							lastlat = lt ; 
							lastlng = lg;
						}
						if (chartdist.length > 0){
							altitudeUser.splice(0,1);
							chartdist.splice(0,1);
						}
						//alert(chartdist);
						$scope.data[0] = altitudeUser;
						$scope.labels = chartdist;
						if(resp.items != null && resp.items.length > 0){
							$scope.map.center.lat  = resp.items[0].Lat - 0.1;
							$scope.map.center.lng = resp.items[0].Lng ;
							$scope.map.center.zoom = 13;
						}
						
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

						var instructionsPopup = $ionicPopup.show({
							title: 'Help',
							template: InstructionsService.instructions.newLocations.text,
							buttons:[
							         {text:'<b>OK</b>',
							          type:'button-positive'},
							         {text:'More info',
							          type:'button-positive',
							          onTap: function(e){
							        	var  link = '#/app/help'
							        		  window.location.href = link;
							          }
							          
							         }
							        	 
							         ]
						});
						instructionsPopup.then(function(res) {
							InstructionsService.instructions.newLocations.seen = true;
						});

					}
								
		            
	//////////////////////////////////////	
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
				               heat: {
				                       name: 'Heat Map',
				                       type: 'heat',
				                       data: trackHeatmapData,
				                       layerOptions: {
				                           radius: 5,
				                           blur: 10
				                       },
				                       visible: true
				                   },
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
									visible: true,
								
								},
								risks_traffic: {
									name: '<img src="img/2.png">'+'Traffic',
									layerOptions:makeGroup('traffic'),
									type: 'markercluster',
									visible: true
								},
								risks_geometric: {
									name: '<img src="img/3.png">'+'Facility',
									layerOptions:makeGroup('geometric'),
									type: 'markercluster',
									visible: true
								} 
								
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
								icon: 'star',
								color: '#0f0'
							}
					};
					$scope.locate3();        

				});
			 
		
			 //			check if code below is useful
			var Location = function() {
				if ( !(this instanceof Location)) return new Location();
				this.lat  = "";
				this.lng  = "";
				this.name = "";
			};
			 $scope.toggleRight = function() {
				    $ionicSideMenuDelegate.toggleRight();
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
				  $scope.closeModal1= function() { 
				    $scope.modal.hide();
			       // $scope.modal.remove()

				  };
				  $scope.$on('$destroy', function() {
					    $scope.modal.remove();
					  });
		   
	     $scope.$on('leafletDirectiveMap.focus', function(event, args){
//		    alert("hello from laod");	
//	    	 loadAllRisks($scope);
		    	loadTrackEvaluationHeatmap();
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
			
			var trackHeatmapData = [];
			function loadTrackEvaluationHeatmap(){
				gapi.client.helloworldendpoints.getTrackHeatmap().
				execute(function (resp) {
					if (resp.error) {
						// The request has failed.
						//alert(resp.error.message);
					} else {
						// The riskReport has succeeded.
						for (item in resp.items){
							var lt = resp.items[item].lat;
							var lg = resp.items[item].lng;
							var value = resp.items[item].segmentValue;
							//alert(value);
							trackHeatmapData.push([lt, lg, value]);							
						}	
					}
				});
			}

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
					//case 4: return 'risks_roadway';
					}
				}

				function layerMarkersColor(riskTypeId) {
					switch (riskTypeId){
					case 1: return '#f00';
					case 2: return '#12a';
					case 3: return '#f70';
					}
				}
				$scope.risksReportMarkers[locationKey] = {
						lat:location.lat,
						lng:location.lng,
						
						message: "Type: "+location.name,
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
						//alert('Geolocation is not supported in your browser');
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
			$scope.locateMe = function(){
				if (navigator.geolocation){				
				navigator.geolocation.getCurrentPosition(showPosition, showError, {enableHighAccuracy : true});
				navigator.geolocation.getCurrentPosition(showPosition, showError, {enableHighAccuracy : true});
				} else {
						//alert('Geolocation is not supported in your browser');
				}							
			}
			
			function showPosition(position){
				$scope.map.center.lat  =  position.coords.latitude;
				$scope.map.center.lng = position.coords.longitude;
				$scope.map.center.zoom = 15;
	            $scope.risksReportMarkers.now = {
	                    lat:position.coords.latitude,
	                    lng:position.coords.longitude,	                    
	                    icon: {
	    						type: 'makiMarker', 
	    						color: '#00bfbf',
	    						size:'l',
	    						icon:'star',	    						
	    					},
	                    message: "You Are Here",
	                    draggable: false,
	                    focus: true,                   
	                  };
	            console.log("endoflocateme");
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
				
			$scope.menuClick = function (trackId1){									
					loadTrack(trackId1);
					loadAltChart();				
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
			
			$ionicModal.fromTemplateUrl('templates/showtrackingdialog.html', {
			    scope: $scope,
			    viewType: 'bottom-sheet',
			    animation: 'slide-in-up'
			  }).then(function(modal) {
			    $scope.modal5 = modal;
			  });
			
			
			$scope.showSettings = function() {
				$scope.MenuTitle = MenuServices[0].MenuTitle;
				$scope.sideMenu = MenuServices[0].menuItems; 
			}

			

			$scope.imageSlides = ImgSlideService.countPM;
			$scope.imageSlides2 = ImgSlideService.countTR;
			$scope.imageSlides3 = ImgSlideService.countGD;


			function deviceInit() {
				console.log("initializing device");
				try {
					$scope.uuid = $cordovaDevice.getUUID();
				}
				catch (err) {
					$scope.uuid = "guest";
					console.log("Error " + err.message);
				}
			}
			$scope.reloadRoute = function() {
				   $window.location.reload();
				}
			
			function encapsulateLocation(location){
				var pos = {};
				var coords = {};
				coords['latitude'] = location['latitude'];
				coords['longitude'] = location['longitude'];
				coords['altitude'] = location['altitude'];
				coords['speed'] = location['speed'];				
				coords['accuracy'] = location['accuracy'];
				coords['altitudeAccuracy'] = location['altitudeAccuracy'];
				coords['heading'] = -1;
				pos['coords'] = coords;
				pos['timestamp'] = location['timestamp'];
				return pos;
			}

			ionic.Platform.ready(function(){
				deviceInit();
				$scope.started = false;
		    $ionicPlatform.registerBackButtonAction(function (event) {
                    event.preventDefault();
            }, 100);
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
				    return states[networkState];

				}
				var connection = checkConnection();
				if (connection != 'No network connection') {
					isOnline = true;
				}
		        
				document.addEventListener("offline", onOffline, false);
				function onOffline() {
				   // Handle the offline event
					isOnline = false;
				
				}
				document.addEventListener("online", onOnline, false);
				function onOnline() {
				   // Handle the offline event
					isOnline = true;
					if ($scope.started == false){
					$scope.reloadRoute();
				}
					
				}	
				document.addEventListener("deviceready",deviceready,false);
				function deviceready(){
					
				     navigator.geolocation.getCurrentPosition(function(p){});
				     loadAllRisks($scope);
				    // bgLocationServicesTraffic.start();

				}
				//Get plugin
				
				navigator.geolocation.getCurrentPosition(function(p){}); // it is required
				
				bgLocationServices =  $window.plugins.backgroundLocationServices;
				//bgLocationServicesTraffic = $window.plugins.backgroundLocationServices;
				//Congfigure Plugin
				bgLocationServices.configure({
				     //Both
					 desiredAccuracy:      0, 
				     distanceFilter:       2, 
				     debug:                false, 
				     interval:             3000, 
				     fastestInterval:      2000, 
				     useActivityDetection: false,	
				     notificationTitle: 'BikeableRoute', // customize the title of the notification
				     notificationText: 'BikeableRoute in Background', //customize the text of the notification     
				});
				
				
				bgLocationServices.registerForLocationUpdates(function(location) {
					var position = encapsulateLocation(location);
					counter = counter+1;
					if($scope.started){					
						showPosition2(position);
					}
					//skip 4 times
					console.log("counter: " + counter);

					if (counter == 10) {
						counter=0;
						showPositionTraffic(position); }		     
				}
				, function(err) {
				     //console.log("Error: Didnt get an update", err);
				});
				bgLocationServices.registerForActivityUpdates(function(acitivites) {
				    // console.log("We got an BG Update" + activities);
				}, function(err) {
				    // console.log("Error: Something went wrong", err);
				});
				bgLocationServices.start();
				$scope.locateMe();
			       			});

			$scope.dev_width = $window.innerWidth;
			$scope.dev_height = $window.innerHeight;
			
   

		
////////////////startTrackingUser With out starting button//////////////
			
			function showPositionTraffic(position){
				console.log("new Traffic location avilable");
				lat_1  = position.coords.latitude;
				lng_1 = position.coords.longitude;
				alti = position.coords.altitude;					            			
				var dateGPS_1 = position.timestamp;		
				var result;
				result = { 'TrackId': 0,
						'Name':$scope.uuid,
						'Lat': lat_1,
						'Lng': lng_1 ,
						'DateTime':dateGPS_1,
						'Place_id':0,
						'Highway':"NA"
				};
				
				gapi.client.helloworldendpoints.gaeTrafficTrack(result).
				execute(function (resp) {
					if (resp.error) {
						
					} 

				});
				
				$scope.$apply();
						
			}
			$scope.distancetoshow=0.0;
			$scope.speedtoshow=0.0;
////////////////startTrackingUsersData/////////////////////////////////////		
			function showPosition2(position){
				console.log("new location avilable");
				lat_1  = position.coords.latitude;
				lng_1 = position.coords.longitude;
				alti = position.coords.altitude;
				$scope.map.center.lat  =  position.coords.latitude-0.001;
				$scope.map.center.lng = position.coords.longitude;
				$scope.map.center.zoom = 17;
				if (alti == null){alti = 0;}
				if((position.coords.speed != null) && (!isNaN(position.coords.speed)) && position.coords.speed > 0){
					console.log("speed"+position.coords.speed);
					spp_1.push(position.coords.speed);
					//spp_1 = (spp_1 + position.coords.speed)/2; //The speed in meters per second.
					//Converted speed to mph.
				}
				
				var spd_sum = 0;
				for(var i = 0; i < spp_1.length; i++){
					spd_sum += spp_1[i];
				}
				var spd_avg = 0;
				if (spp_1.length>0)
					spd_avg = spd_sum / spp_1.length; 
				var speedavgtoshow=spd_avg * 2.2369;
				$scope.distancetoshow =(spd_avg * $scope.totalSeconds)*0.000621371;
			    $scope.speedtoshow=speedavgtoshow>1 ? speedavgtoshow: 0.0; //miles..
				$scope.risksReportMarkers.now = {
							lat:position.coords.latitude,
							lng:position.coords.longitude, 
							icon: {
								type: 'makiMarker', 
	    						color: '#00d748',
	    						icon:"bicycle",
	    						size:'m',							
					}
				
			};
				if ($scope.checkBoxState == true ){
					addToPath(position.coords.latitude, position.coords.longitude);
				}	            			
//				var dateGPS_1 = position.timestamp;		
//					pointId +=1;
//					storeTrack(trackid_1, pointId, $scope.uuid, dateGPS_1, lat_1, lng_1, alti,0,"NA");			 
//				$scope.$apply();
						
			}// endOf Showposition2()
			
			
			
      	
            $scope.getAccel = function(){	
            	var accel= []; 
    			accel[0]=0;
    			accel[1]=0;
    			accel[2]=0;
					watchIDAcc = navigator.accelerometer.watchAcceleration(onSuccess, onError, optionsAcc);
						 function onSuccess(acceleration) {
							 accel_x =  acceleration.x ;
							 accel_y = acceleration.y;
							 accel_z = acceleration.z;
							 Timestamp = acceleration.timestamp;
							//ramp-speed - play with this value until satisfied
								var  kFilteringFactor = 0.1;
								accel[0] = accel_x * kFilteringFactor + accel[0] * (1.0 - kFilteringFactor);
								accel[1] = accel_y * kFilteringFactor + accel[1] * (1.0 - kFilteringFactor);
								accel[2] = accel_z * kFilteringFactor + accel[2] * (1.0 - kFilteringFactor);
								resultXYZ.x = accel_x - accel[0];
								resultXYZ.y = accel_y - accel[1];
								resultXYZ.z = accel_z - accel[2];
							};
							function onError() {
								//alert("didn't catch accelerometer");
							};
							var optionsAcc = { frequency: 1000 };  // Update every 1s

	             	
            };
            /////////////endOfAccelerometer////////////////////	
			
			
			
			/////////highway/////////// 
//			$scope.gethighway = function(){
//			    var xhttp = new XMLHttpRequest();
//			    xhttp.onreadystatechange = function() {
//			        if (xhttp.readyState == 4 && xhttp.status == 200) {
//			            myFunction(xhttp);
//			        }
//			    };
//			    xhttp.open("GET", "http://www.openstreetmap.org/api/0.6/way/"+highwayTag , true);
//			    xhttp.send();
//			    function myFunction(xml) {
//			        var xmlDoc = xml.responseXML;
//			        highwayValue = xmlDoc.getElementsByTagName("tag")[0];
//			         txt = highwayValue.getAttribute("k");
//			         txt2 = highwayValue.getAttribute("v");
//	                if (txt != "highway"){
//	                	txt2= "NA";			                	
//	                }
//	                $scope.getAccel();
//			    	}
//			    }
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
			function stopWatchAccel(){
				if (watchIDAcc) {
	                navigator.accelerometer.clearWatch(watchIDAcc);
	                watchIDAcc = null;
	            }
			}
////////////////endOfTrackingUsersData/////////////////////////////////////
			
			function getCurrentTime(){
				var d = new Date(); // for now
				return d.getSeconds()+d.getMinutes()*60 +d.getHours()*3600;
			}
			

////////////////////////// offline report
			$scope.offlineReport = function(){
				if (navigator.geolocation){
					var	optn= {
								enableHighAccuracy : true,
								timeout : Infinity,
								maximumAge : 0
						}
						navigator.geolocation.getCurrentPosition(positionReportsOff,null, optn);
					}  
				$scope.modal.show();
			};
			function positionReportsOff(position){
				$scope.newLocation = new Location();
				$scope.newLocation.lat = position.coords.latitude;
				$scope.newLocation.lng = position.coords.longitude;
			}

			//count up timer in angular..
			var timer;
			$scope.countuphour=0;
			$scope.countupminute=0;
			$scope.countupseconds=0;
			$scope.startcountuptimer=function(){
				$scope.totalSeconds = 0;
				timer = $interval(function(){
					console.log("inside start timer function");
					$scope.totalSeconds++;
					$scope.countuphour = Math.floor($scope.totalSeconds/3600);
					$scope.countupminute = Math.floor(($scope.totalSeconds - $scope.countuphour*3600)/60);
					$scope.countupseconds = $scope.totalSeconds - ($scope.countuphour*3600 + $scope.countupminute*60);			
				    }, 1000);
	          }		
			
			$scope.stopcountuptimer=function(){
				console.log("inside stop timer");
				$interval.cancel(timer);
			}	
			
/////////////////start-stop ///////////////////////////////
			
			$scope.start = function start(){				
				//$scope.started = !$scope.started;							
				console.log("inside start function");
				if(!$scope.started){
				$scope.modal5.show();
				$scope.countuphour=0;
				$scope.countupminute=0;
				$scope.countupseconds=0;
				$scope.startcountuptimer();	
			    //loadAllRisks($scope);
				$scope.started = true;
				$scope.say('start tracking.');
				$scope.recordedPaths['path'].latlngs=[];				
				//bgLocationServices.start();
				options = {
						enableHighAccuracy: true,desiredAccuracy: 0, frequency: 3000
						};
				watchId = navigator.geolocation.watchPosition(showPosition2, showError2, options);
				spp_1 = [];		    				    
				placeId = 0;
				duration = getCurrentTime();
				getNextTrackId(function(id){
					    trackid_1=  id;
					    pointId = 0;						
					});				
				}
				else 
					{
						$scope.started = false;
						stop();					
					}
			}
			function stop() {
				$scope.stopcountuptimer();
				$scope.modal5.hide();
				$scope.started = false;
				$scope.say('tracking is stopped.');
				stopWatch();
				//stopWatchAccel();
				//bgLocationServices.stop();
				var finishTime = getCurrentTime();// to get current time when stopped in second
				duration = finishTime - duration;// time duration of tracking in seconds
				//sendTracks2GAE();
				var spd_sum = 0;
				for(var i = 0; i < spp_1.length; i++){
					spd_sum += spp_1[i];
				}
				var spd_avg = 0;
				if (spp_1.length>0)
					spd_avg = spd_sum / spp_1.length; 
			    dist = (spd_avg * duration);// distance in meter 
				var mph = spd_avg * 2.2369;
				convertedSpd = mph.toFixed(2);// speed in mph
				if (trackid_1 != null){
					$scope.trid= trackid_1;
					$scope.showevaluation();					
					updateAlt (trackid_1, $scope.uuid, duration, dist, convertedSpd);
					MenuServices[2](); // showDynamicTracksMenu()
					sendUserData(trackid_1);
//					var stepLength = 0.5; // 50 centimeter
//					var steps = Math.round(dist/stepLength);
//					if(steps==0) steps = 20;
					//ToDo: check to see if authenticate is available
					//if(spd_1 < 7) // this is the average running speed
					//$scope.senddatapoint(steps);		
				}
				trackid_1 = null;
			}
			
			$scope.sendEvaluation = function(){
				 $scope.closeModal();
				sendSegValue($scope.trid,$scope.uuid,$scope.option.value*0.2);			
				//sendUserEvaluation($scope.trid);
			}
			$scope.option={
					  value:1
			  }		
			  $scope.showevaluation = function() {				
				$scope.activeSlide = 1;
			        $scope.showModal('templates/user-evaluation.html');
			    }					
			    $scope.showModal = function(templateUrl) {
			        $ionicModal.fromTemplateUrl(templateUrl, {
			            scope: $scope,
			            animation: 'slide-in-up'
			        }).then(function(modal) {
			            $scope.modal4 = modal;
			            $scope.modal4.show();
			        });
			    }	    
			    $scope.closeModal = function() {
			        $scope.modal4.hide();
			        $scope.modal4.remove()
			    }; 
			    
				$scope.selectedItem = {};
				
				$scope.getpalceIdforRisk = function(){
					var val = $scope.selectedItem.value;
					var ty = $scope.selectedItem.type;
					var id = $scope.selectedItem.title;
					var ltd = $scope.newLocation.lat;
					var lgd = $scope.newLocation.lng;
					var tid = (trackid_1==null)? 0:trackid_1; //if users don't start record their track while reporting their trackid_1 will be null.				
					var dtt = getSysDate();
					if (isOnline == true){
						var req_url = "https://nominatim.openstreetmap.org/reverse?format=json&lat="+ltd+"&lon="+lgd;
						$.ajax({
				            type: "GET",
				            url: req_url,
				            success: function (response) {
				                placeIdforRisk = response['place_id'];
				                highwayForRisk = response['osm_id'];
				                if (highwayForRisk != null){
				                	$scope.gethighwayForRisk();
				                }
				                else {
						                highwayValueRisk = "NA";
						                storeReport(tid, $scope.uuid, id, ty, val, dtt, ltd, lgd,placeIdforRisk,highwayValueRisk);		                	               
				                }		                
								$scope.saveLocation();
				                $scope.$apply();
				            },
						 timeout:3000
				        });
					}
					else if (isOnline == false){
		                storeReport(tid, $scope.uuid, id, ty, val, dtt, ltd, lgd,0,"NA");		                	               
						$scope.saveLocation();
//						alert('offline:'+tid+','+ $scope.uuid+','+ id+','+ ty+','+ val+','+ dtt+','+ ltd+','+ lgd+','+,"NA");
					}
					$scope.gethighwayForRisk = function(){
					    var xhttp = new XMLHttpRequest();
					    xhttp.onreadystatechange = function() {
					        if (xhttp.readyState == 4 && xhttp.status == 200) {
					            myFunction(xhttp);
					        }
					    };
					    xhttp.open("GET", "http://www.openstreetmap.org/api/0.6/way/"+highwayForRisk , true);
					    xhttp.send();
					    function myFunction(xml) {
					        var xmlDoc = xml.responseXML;
					        highwayValueRisk = xmlDoc.getElementsByTagName("tag")[0];
					         txt = highwayValueRisk.getAttribute("k");
					         txt2 = highwayValueRisk.getAttribute("v");
			                if (txt != "highway"){
			                	txt2= "NA";			                	
			                }
			                storeReport(tid, $scope.uuid, id, ty, val, dtt, ltd, lgd,placeIdforRisk,txt2);
					    	}
					    }
			       }
				
				
				$scope.report = function (){
					 $scope.getpalceIdforRisk();
					 $scope.closeModal();//3
					 
				}
				
				$scope.rangeChange = function(item){
					$scope.selectedItem = item;
				}
////////////////end of start-stop //////////
				setInterval(
			    function sendUserEvaluation(){
			    if (isOnline == true){
					db.transaction(function (tx) {
						var result;	
						tx.executeSql("SELECT * FROM segmentvalues where deleted = 0", [], function(tx, rs){
							for(var i=0; i<rs.rows.length; i++) {
								var row = rs.rows.item(i);
								if(row['UserId']!= null && row['TrackId'] != null && row['SegmentValue'] != null) {
									result = { 'TrackId': row['TrackId'],
											'User_Name':row['UserId'],
											'Segment_value': row['SegmentValue'].toPrecision(1),
											'Date':row['date']
									};							
									gapi.client.helloworldendpoints.userEvaluation(result).
									execute(function (resp) {
										if (resp.error) {

										} else {
											updateSeg(resp.TrackId, resp.UserName, resp.SegmentValue);
										}
			
									});
								}
							} // end for loop
							tx.executeSql('Delete From segmentvalues where deleted = 1');
						});
					});
					}			    
			  }
				 ,1000*30);
			    
			    
			    
/////////////////////////////////////////	
			 function sendUserData(trackid){
				  if (isOnline == true){  
					db.transaction(function (tx) {
						var result;	
						tx.executeSql("SELECT * FROM trackIds WHERE TrackId = ?;", [trackid], function(tx, rs){
							for(var i=0; i<rs.rows.length; i++) {
								var row = rs.rows.item(i);
								if(row['UserId']!= null && row['TrackId'] != null && row['duration'] != null) {
									result = { 'TrackId': row['TrackId'],
											'User_Name':row['UserId'],
											'date': row['date'],
											'duration':row['duration'],
											'distance' :row['distance'],
											'speed':row['speed']
											
									};							
									gapi.client.helloworldendpoints.saveUserData(result).
									execute(function (resp) {
										if (resp.error) {
											// The request has failed.
										
										} else {										
										}			
									});
								}
							} // end for loop							
						});
					});
				  	}
				}
			
///////////////feedback///////////////////
		    $scope.email = {
		    		name: '',
		    		text: '',
		    		message: ''
		    }
		    
		    $scope.sendMail = function () {
		    	var date = getSysDate();
		    	storeFeedback($scope.email.name, $scope.email.text, $scope.email.message,date);
		    	sendUserFeedback($scope.email.name);
		    }
		    
		    $(document).on('submit','#contact', function (e){
		      //  e.preventDefault();
		       var alertPopup = $ionicPopup.alert({
		        	title:'Submitted',
		            template:'Thanks for contacting us'
		            
		        });
		        alertPopup.then(function(e) {
		        	window.location.href = "#/app/map";
		        });
		        
		        
		    });
		    

			 function sendUserFeedback(uname){
					db.transaction(function (tx) {
						var result;	
						tx.executeSql("SELECT * FROM feedback WHERE name = ?;", [uname], function(tx, rs){
							for(var i=0; i<rs.rows.length; i++) {
								var row = rs.rows.item(i);
								if(row['name']!= null && row['emailAddress'] != null && row['message'] != null) {
								result = { 'Name': row['name'],
											'EmailAddress':row['emailAddress'],
											'Message': row['message'],
											'Date':row['date']
											
									};							
									gapi.client.helloworldendpoints.saveFeedback(result).
									execute(function (resp) {
										if (resp.error) {
											// The request has failed.
											//alert(resp.error.message);
										} else {
											// The request has succeeded.
											
										}
			
									});
								}
							} // end for loop
							
						});
					});
					}
///////////////end of feedback///////////////////
			 $scope.showTableTrack = function (){
				 var table = [];
				   db.transaction(function (tx) {
						var result;	
						var transfered = 0;
						tx.executeSql("SELECT * FROM tracks where deleted = 0;", [], function(tx, rs){
							for(var i=0; i<rs.rows.length; i++) {
								var row = rs.rows.item(i);
								if (row['TrackId']!= null){
								result = { 'TrackId': row['TrackId'],
										'PointId': row['PointId'],
										   'Name': row['UserId'],
										   'DateTime': row['date'],
										   'Lat': row['lat'],
										   'Lng': row['lng'],
										   'Alt': row['alt'],
										   'Place_id':row['place_id'],
										   'Highway':row['highway'],
										   'deleted':row['deleted']

								};
								table.push(result);
								
							}
							}
							$scope.mytable = table;
						});												
					});
			 }
			 

			 $scope.clearTable = function(){
				 db.transaction(function (tx) {
					 tx.executeSql("Delete FROM tracks;", []);
				 });
			 }
///////////////check if connection is available send data to GAE//////////////////
			 

			// send the tracks table to GAE datastore
			
				
			 function sendTracks3GAE(){
			   if (isOnline == true){
			   db.transaction(function (tx) {
					var result;	
					var transfered = 0;
					tx.executeSql("SELECT * FROM tracks where deleted = 0;", [], function(tx, rs){
						for(var i=0; i<rs.rows.length; i++) {
							var row = rs.rows.item(i);
							if (row['TrackId']!= null){
							result = { 'TrackId': row['TrackId'],
									'PointId': row['PointId'],
									   'Name': row['UserId'],
									   'DateTime': row['date'],
									   'Lat': row['lat'],
									   'Lng': row['lng'],
									   'Alt': row['alt'],
							           'Place_id':row['place_id'],
									   'Highway':row['highway'],

							};
							
							gapi.client.helloworldendpoints.saveTrack(result).
							execute(function (resp) {
								if (resp.error) {
									// The request has failed.
									} else {
									updateTrack(resp.TrackId, resp.PointId, resp.Name);
								}
							});
						}
						}
					});
					
				tx.executeSql('Delete From tracks where deleted = 1');
					
				});
				 }
			 }
			 
			 
			 
			 function sendTracks2GAE(){
			console.log("inside the sendtrackGAE");
			   if (isOnline == true){
			   db.transaction(function (tx) {
				   console.log("inside db.trasaction");
					var result;	
					var transfered = 0;
					tx.executeSql("SELECT * FROM tracks where deleted = 0;", [], function(tx, rs){
						var nextTime = null;
						for(var i=0; i<rs.rows.length; i++) {
							var row = rs.rows.item(i);						
							if(i < rs.rows.length)
								nextTime = rs.rows.item(i+1)['date'];
							else 
								nextTime = row['date'];
							if (row['TrackId']!= null){
							result = { 'TrackId': row['TrackId'],
									  'PointId': row['PointId'],
									   'Name': row['UserId'],
									   'DateTime': row['date'],
									   'Lat': row['lat'],
									   'Lng': row['lng'],
									   'Alt': row['alt'],
									   'Place_id':row['place_id'],
									   'Highway':row['highway'],
									   'nextTime': nextTime

							};														
							
							gapi.client.helloworldendpoints.saveTrack2(result).
							execute(function (resp) {
								if (resp.error) {
									// The request has failed.
									} else {
									updateTrack(resp.TrackId, resp.PointId, resp.Name);
								}
							});
						}
						}
					});
					
				tx.executeSql('Delete From tracks where deleted = 1');
					
				});
				 }
			 }
			
			
			 setInterval(function(){
			    if (isOnline == true){
				db.transaction(function (tx) {
					var result;	
					tx.executeSql("SELECT * FROM reportrisk where deleted = 0;", [], function(tx, rs){
						for(var i=0; i<rs.rows.length; i++) {
							var row = rs.rows.item(i);
							result = { 'Track_Id': row['TrackId'],
									'User_Name': row['UserId'],
									'Risk_Id':row['riskId'],
									'RiskType' :row['riskType'],
									'RiskValue':row['Value'],
									'Date_Time': row['date'],
									'Latitude': row['lat'],
									'Longitude': row['lng'],
									'Place_id' : row['place_id'],
									'Highway':row['highway']
							};							

							gapi.client.helloworldendpoints.saveReport(result).
							execute(function (resp) {
								if (resp.error) {
									// The request has failed.
								} else {
									updateReport(resp.TrackId, resp.UserName, resp.RiskId, resp.riskType, resp.riskValue, resp.Date, resp.Lat, resp.Lng, resp.Place_id, resp.Highway);									
								}
							});
						}
						
					});
					tx.executeSql('Delete From reportrisk where deleted = 1');

				});	 
			    }
			},1000*30);
			
			
//////////////////////end of sending data to GAE/////////////////////////			
		
			$scope.showImages = function(index) {
		        $scope.activeSlide = index;
		        $scope.showModal('templates/image-popover.html');
		    }	
			$scope.showImages2 = function(index) {
		        $scope.activeSlide = index;
		        $scope.showModal('templates/imagPopoverTraffic.html');
		    }
			$scope.showImages3 = function(index) {
		        $scope.activeSlide = index;
		        $scope.showModal('templates/imagPopoverFacility.html');
		    }
		    $scope.showModal = function(templateUrl) {
		        $ionicModal.fromTemplateUrl(templateUrl, {
		            scope: $scope,
		            animation: 'slide-in-up'
		        }).then(function(modal) {
		            $scope.modal3 = modal;
		            $scope.modal3.show();
		        });
		    }
		    
		    $scope.closeModal = function() {
		        $scope.modal3.hide();
		        $scope.modal3.remove()
		    };
		
			
//////////////////////			

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
				var miSeconds = currentTime.getMilliseconds();
				if (miSeconds<10){
					miSeconds = '0'+miSeconds;
				}
				
				var month = currentTime.getMonth() + 1;
				if (month<10){
					month = '0'+month;
				}
				var day = currentTime.getDate();
				if (day<10){
					day = '0'+day;
				}
				var year = currentTime.getFullYear();
				if (year<10){
					year = '0'+year;
				}
				var t1 = hours +":"+minutes+":"+seconds+":"+miSeconds;
				var d = year+"-"+month+"-"+day;
				var dateTime= d+" "+t1;

				return  dateTime;
			}




			 $scope.trash = function trash(id){				 
				 if (confirm('Are you sure you want to delete?')) {					 					
					 MenuServices[1].menuItems.splice((id-1), 1);
					 deleteTrack(id);
					 console.log(JSON.stringify(MenuServices[1].menuItems));
					 MenuServices[2]();	
					 $scope.groups = [];
					 window.location.href = "#/app/search";		
					 $scope.call();
					} else {
					    // Do nothing!
					}
				  
			  }
			  $scope.groups = [];
			  $scope.showTrackHistory = function(){ 
					$scope.sideMenu = MenuServices[1].menuItems;	
				}
			  
			  $scope.call = function(){
				  var ln = MenuServices[1].menuItems.length;
				  var i = 0;
				  for (var mnu in MenuServices[1].menuItems) {
					  
				    $scope.groups[i] = {
				      name: MenuServices[1].menuItems[mnu].name,
				      id: MenuServices[1].menuItems[mnu].trackId,
				      items: []
				    };
				   
				      $scope.groups[i].items.push({
				    		  'itemVal':MenuServices[1].menuItems[mnu].date,
				    		  'class': 'icon ion-ios-calendar'
				      });
				      $scope.groups[i].items.push({
				    	  'itemVal':MenuServices[1].menuItems[mnu].time,
				    	  'class': 'icon ion-ios-time-outline'
				      });
				      
				      $scope.groups[i].items.push({
				    	  'itemVal': MenuServices[1].menuItems[mnu].duration,
				    	  'class': 'icon ion-ios-stopwatch'
				      });
				      $scope.groups[i].items.push({
				    	  'itemVal': MenuServices[1].menuItems[mnu].distance,
				    	  'class': 'icon ion-ios-information-outline'
				      });
				   $scope.groups[i].items.push({
					   'itemVal':MenuServices[1].menuItems[mnu].speed,
					   'class': 'icon ion-ios-speedometer'
					  });
				   
				    i+=1;
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
			  
			  $scope.checkBoxState = false;
			  
			  $scope.isChecked = function (){
				 $scope.checkBoxState = !$scope.checkBoxState ;
//				  
//				  if ($scope.checkBoxState == true ){
//					  $scope.login();
//				  }
			  }
			  
//////////////////////googleFit/////////////////////////
/*			  
			  $scope.dsnames = [];
				var authCode = ''; 
				//authCode += googleLogin.accessToken;
				
				$scope.getdatasource = function(){
					var req_url = "https://www.googleapis.com/fitness/v1/users/me/dataSources";
					$.ajax({
			            type: "GET",
			            url: req_url,
			            beforeSend : function( xhr ) {
			                xhr.setRequestHeader('Authorization', authCode);
			            },
			            success: function (response) {
			                
			                var dss = response['dataSource'];
			                var dsname = [];
			                for (i = 0; i < dss.length; i++) { 
			                	dsname.push(dss[i].dataStreamId);
			                }
			                $scope.dsnames = dsname;
			                console.log(response);
			                $scope.$apply();
			            }
			        });
				}
				
				$scope.postdatasource = function(){
					var req_url = "https://www.googleapis.com/fitness/v1/users/me/dataSources/";
					$.ajax({
			            type: "POST",
			            url: req_url,
			            dataType: "json",
			            contentType: "application/json; charset=utf-8",
			            data: JSON.stringify( {
			          	  "dataStreamId":
			        	      "derived:com.google.step_count.delta:924675608361:Example Manufacturer3:ExampleTablet:1000008:",
			        	  "dataStreamName": "",
			        	  "name": "myDataSource3",
			        	  "type": "derived",
			        	  "application": {
			        	    "detailsUrl": "http://example.com",
			        	    "name": "apptest",
			        	    "version": "1"
			        	  },
			        	  "dataType": {
			        	    "field": [
			        	      {
			        	        "name": "steps",
			        	        "format": "integer"
			        	      }
			        	    ],
			        	    "name": "com.google.step_count.delta"
			        	  },
			        	  "device": {
			        	    "manufacturer": "Example Manufacturer3",
			        	    "model": "ExampleTablet",
			        	    "type": "tablet",
			        	    "uid": "1000008",
			        	    "version": "1"
			        	  }
			        	}),

			            beforeSend : function( xhr ) {
			                xhr.setRequestHeader('Authorization', authCode);
			            },
			            success: function (response) {
			                console.log(response);
			                
			            },
			            failure: function(errMsg) {
			                alert(errMsg);
			            }
			            
			        });
				}
				$scope.getdatapoint = function(){
					var req_url = "https://www.googleapis.com/fitness/v1/users/me/dataSources/";
					req_url += "derived:com.google.step_count.delta:924675608361:Example Manufacturer3:ExampleTablet:1000008:/datasets/1397513334728708316-1397513675197854515";
					$.ajax({
			            type: "GET",
			            url: req_url,
			            dataType: "json",
			            contentType: "application/json; charset=utf-8",
			                       
			            beforeSend : function( xhr ) {
			                xhr.setRequestHeader( 'Authorization', authCode);
			            },
			            success: function (response) {
			                console.log(response);
			            },
			            failure: function(errMsg) {
			                alert(errMsg);
			            }
			            
			        });
				}
				$scope.senddatapoint = function(pointVal){
					var d = new Date();
					var nanoSec = d.getTime();
					var nanoSec1 = nanoSec+1;
					nanoSec = nanoSec * 1000000;
					nanoSec1 = nanoSec1 * 1000000;
					
					var req_url = "https://www.googleapis.com/fitness/v1/users/me/dataSources/";					
					req_url += "derived:com.google.step_count.delta:924675608361:Example Manufacturer3:ExampleTablet:1000001:/datasets/";
					req_url += nanoSec + '-' + nanoSec1;
									
					$.ajax({
			            type: "PATCH",
			            url: req_url,
			            dataType: "json",
			            contentType: "application/json; charset=utf-8",
			           data: JSON.stringify(
			        		   {
			        			   "dataSourceId":
			        			       "derived:com.google.step_count.delta:924675608361:Example Manufacturer3:ExampleTablet:1000001:",			        			   
			        			   "maxEndTimeNs": nanoSec1,
			        			   "minStartTimeNs": nanoSec,
			        			   "point": [
			        			             {
			        			                 "dataTypeName": "com.google.step_count.delta",
			        			                 "endTimeNanos": nanoSec1,
			        			                 "originDataSourceId": "",
			        			                 "startTimeNanos": nanoSec,
			        			                 "value": [
			        			                   {
			        			                     "intVal": pointVal
			        			                   }
			        			                 ]
			        			               }
			        			             ]
			        			 }
			),
			            
			            
			            beforeSend : function( xhr ) {
			                xhr.setRequestHeader( 'Authorization', authCode);
			            },
			            success: function (response) {
			                console.log(response);
			               // alert('your step has been sent');
			            },
			            failure: function(errMsg) {
			                console.log('******* error !!!');
			            }
			            
			        });
				}
			  $scope.google_data = {};
			    $scope.login = function () {
			        var promise = googleLogin.startLogin();
			        promise.then(function (data) {
			            $scope.google_data = data;
			        }, function (data) {
			            $scope.google_data = data;
			        });
			        authCode = 'Bearer ';
			        authCode += googleLogin.accessToken;
			        $scope.getdatasource();
			        $scope.postdatasource();

			        
			    } 
			    
/////////////////////end of googleFit///////////////
*/			    $scope.isActive = true;
			    $scope.btnText = "Start Tracking";
			    $scope.activeButton = function() {
			      $scope.isActive = !$scope.isActive;
			      if($scope.btnText=="Start Tracking")
			        $scope.btnText = "Stop Tracking";
			      else 
			        $scope.btnText = "Start Tracking";
			    }
			    
			    
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

app.filter('counterValue', function(){
	   return function(value){
	     var valueInt = parseInt(value);
	      if(!isNaN(value) && value >= 0 && value < 10)
	         return "0"+ valueInt;
	      return value;
	   }
	})


