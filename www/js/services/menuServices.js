angular.module('starter').factory('MenuServices', [ function() {

	//settings
  var menu1 = {};
  menu1.MenuTitle = 'Settings';
  menu1.menuItems = [
    {
      
    }
  ];
  
  var menu2 = {};
  menu2.MenuTitle = 'Recorded Tracks';
  menu2.menuItems = [{}];
  
  function showDynamicTracksMenu() {
      var routes;
	  getRecordedRoutes(function(rs){
		  //menu2.menuItems = [];
		  //console.log(JSON.stringify(rs));
		  routes = rs;
		  var i = 0;
		  for (var idx in routes){
			 var  day = routes[idx].date;
			 var t = day.split(/[- :]/);

			// Apply each element to the Date function
			 var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
			 var tm = new Date(d);
			 var n = tm.toString();
			 var dd = n.substring(0,15);
			 var res = n.substring(16,21);
			 
			 var dur = (routes[idx].duration != null)? routes[idx].duration:0; // in seconds
			 var dis = (routes[idx].distance != null)? routes[idx].distance:0; // in meter
			 var mile = (dis*0.000621371192);
			 mile = mile.toPrecision(3);
			 var minute = Math.floor(dur/60);
			 if (minute<10){
					minute = '0'+minute;
				}
			 var second = dur - minute * 60;
			 if (second<10){
				 second = '0'+second;
				}
		     menu2.menuItems[i] = {
					  name: 'No. '+ routes[idx].TrackId,
					  date: dd,
					  time:res,
					  duration:'duration: '+minute+':'+second,
					  distance:'distance:'+ mile + ' mi',
					  speed:'speed: '+routes[idx].speed + ' mph',
					  trackId : routes[idx].TrackId
					  };
			  i +=1;
		  }
	  });
  }
  showDynamicTracksMenu();
  
  return [menu1,menu2,showDynamicTracksMenu];

}]);
