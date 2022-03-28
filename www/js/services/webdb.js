var db = openDatabase('mydb','1.0','test db', 2*1024*1024);

function getDate(){
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

function createTable(){
	db.transaction(function(tx){
//		tx.executeSql('DROP TABLE reportrisk');
//		tx.executeSql('DROP TABLE trackIds');
//		tx.executeSql('DROP TABLE tracks');
//		tx.executeSql('DROP TABLE segmentvalues');
		tx.executeSql('CREATE TABLE IF NOT EXISTS tracks(TrackId INTEGER, PointId INTEGER, UserId TEXT, date LONG, lat LONG, lng LONG, alt LONG,place_id DOUBLE, highway TEXT,deleted INTEGER)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS risktype(riskCategoryId TEXT, descriptionrisks TEXT)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS riskfactor(riskId TEXT,riskCategoryId TEXT, riskName TEXT, minrisk INTEGER, maxrisk INTEGER)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS trackIds(TrackId INTEGER, UserId TEXT, date DATETIME, duration INTEGER, distance LONG, speed LONG)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS reportrisk(TrackId INTEGER, UserId TEXT, riskId TEXT, riskType INTEGER, Value INTEGER, date DATETIME, lat LONG, lng LONG,place_id DOUBLE, highway TEXT,deleted INTEGER)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS feedback(name TEXT, emailAddress TEXT, message TEXT,date DATETIME)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS segmentvalues(TrackId INTEGER,UserId TEXT, SegmentValue LONG,date DATETIME,deleted INTEGER)');
	});
}

function getRecordedRoutes(callback){
	var result = [];
	db.transaction(function(tx){
	    tx.executeSql("SELECT TrackId, date, duration, distance, speed FROM trackIds", [], function(tx, rs){
		         for(var i=0; i<rs.rows.length; i++) {
		            var row = rs.rows.item(i);
		            result[i] = { 'TrackId': row['TrackId'],
		            		   'date': row['date'],
		            		   'duration':row['duration'],
		            		   'distance': row['distance'],
		            		   'speed': row['speed']
		            };		         
		         }
		         callback(result);
         });	    
	});
}

function storeTrack(trackid, pointId, uuid, date, lat, lng, alt,place_id,hway){
	db.transaction(function(tx){
		if(lat!= null && lng != null){
			tx.executeSql('insert into tracks(TrackId, PointId, UserId, date, lat, lng, alt,place_id,highway,deleted ) values(?,?,?,?,?,?,?,?,?,0)',[trackid, pointId, uuid, date, lat, lng,alt,place_id,hway]);
		}});
}

function updateTrack (trackid, pointid, uuid){
	 db.transaction(function(tx){	
			tx.executeSql('UPDATE tracks SET deleted=1 WHERE TrackId =? and PointId=? and UserId=?',[trackid, pointid, uuid]);
	 });	
}

function storeReport(tid, uname, riskId, riskType, riskVal, dt, lt, lg,plcId,hway){
	 db.transaction(function(tx){					
			tx.executeSql('INSERT INTO reportrisk(TrackId, UserId, riskId, riskType, value, date, lat, lng, place_id,highway,deleted) values(?,?,?,?,?,?,?,?,?,?,0)',[tid, uname, riskId, riskType, riskVal, dt, lt, lg,plcId,hway]);
		 });
}

function updateReport (tid, uname, riskId, riskType, riskVal, dt, lt, lg,plcId,hway){
	 db.transaction(function(tx){					
			tx.executeSql('UPDATE reportrisk SET deleted=1 WHERE TrackId=? and UserId=? and riskId=? and riskType=? and value=? and date=? and lat=? and lng=? and place_id=? and highway=?',[tid, uname, riskId, riskType, riskVal, dt, lt, lg,plcId,hway]);

	 });
	
}

function storeFeedback(uname, uemail, umessage, udate){
	 db.transaction(function(tx){					
			tx.executeSql('INSERT INTO feedback(name, emailAddress, message, date) values(?,?,?,?)',[uname, uemail, umessage, udate]);
		 });
}

function getNextTrackId(callback){
	// callback method is to process results
	var id = 0;
	db.transaction(function(tx){
	tx.executeSql('select max(TrackId) as mx from trackIds',[],
			function(tx,result) { 
	            id = result.rows.item(0).mx;	
	            id = id + 1;
	            var dt = getDate();
	            tx.executeSql('insert into trackIds(TrackId, date) values(?,?)',[id, dt], 
	            		function(tx, rst){
	            	callback(id);
	            	});
    	});	
	});
}
function updateAlt (trackId, userid_1, duration, dist, spp_1){
	 db.transaction(function(tx){					
			tx.executeSql('UPDATE trackIds SET UserId=?, duration=?, distance=?, speed=? WHERE TrackId=?', [userid_1, duration, dist, spp_1, trackId]);

	 });
	
}
function deleteTrack (trid){
	db.transaction(function(tx){
		console.log(trid);
		tx.executeSql('DELETE FROM trackIds WHERE TrackId = ?', [trid]);
	});
}
function sendSegValue(trackId,userid_1,value){
db.transaction(function(tx){
	var dt = getDate();
	tx.executeSql('insert into segmentvalues (TrackId,UserId,SegmentValue,date,deleted) values(?,?,?,?,0)', [trackId,userid_1,value,dt]);
 });

}
function updateSeg (trackId,userid_1,value){
	 db.transaction(function(tx){					
			tx.executeSql('UPDATE segmentvalues SET deleted=1 WHERE TrackId=? and UserId=? and SegmentValue=? ',[trackId,userid_1,value]);

	 });
	
}

