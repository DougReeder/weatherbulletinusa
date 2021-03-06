/*
|| 28-MAR-2015 - George Mari|
|| Re-factor all functions related to processing current conditions into this separate file.
*/

enyo.kind({
   name: "wbu_cc_dl",
   kind: "Component",
   components: [
		{name: "dlNWS_cc",
			kind: "WebService",
			onSuccess: "NWS_cc_Success",
			onFailure: "NWS_cc_Failure"}
 ],
  
	create: function() {
		this.inherited(arguments);
   
		enyo.log("wbu_cc_dl: executing create.");
	
		this.uniqueStations = [];
		this.stationCounter = -1;
		this.uniqueStationsCachedLength = 0;
		this.CC = [];

   },

	downloadCurrentConditions: function(p_alertLocations) {
		// Each city we have saved in our preferences 
		// will have the id of the weather station we will
		// download current observations for.  
		// The general URL pattern is http://weather.gov/xml/current_obs/station_id.xml
		var CCUrlPart1 = "http://weather.gov/xml/current_obs/";
		var CCUrlPart2 = ".xml";
		var CCUrl = "";
		var uniqueStationIds = [];
		var uniqueStations = {};
		var o = {};
		enyo.log('downloadCurrentConditions: this.alertLocations is ' + enyo.json.stringify(this.alertLocations));
		if(p_alertLocations !== undefined && p_alertLocations !== null)
			{
			enyo.log("downLoadCC - assigning alertLocations...");
			this.alertLocations = p_alertLocations;
			}
		else
			{
			enyo.log("downLoadCC - p_alertLocations parameter was not set...");
			}

		// Generate a list of unique stationIds from our alert locations.
		for (i=0; i < this.alertLocations.length; i=i+1) {
			uniqueStations[this.alertLocations[i].obsvStationId] = this.alertLocations[i].obsvStationId;
		}
      for (o in uniqueStations) {
			if (uniqueStations.hasOwnProperty(o)) {
				uniqueStationIds.push(uniqueStations[o]);
			}
		}

		this.stationCounter = this.stationCounter + 1;

		if(this.stationCounter + 1 <= uniqueStationIds.length)
			{
			CCUrl = CCUrlPart1 + uniqueStationIds[this.stationCounter] + CCUrlPart2;
			enyo.log('downloadCurrentConditions CCUrl is ' + CCUrl);
			this.$.dlNWS_cc.setUrl(CCUrl);
			this.$.dlNWS_cc.call();
			}
		else
			{
			// We've gone through all the stations, so reset the counter for next time
			// that the alarm goes off.
			this.stationCounter = -1; 
			}

	},

	NWS_cc_Success: function (inSender, inResponse) {

		enyo.log("Current conditions: " + enyo.json.stringify(inResponse));
		// We successfully downloaded a observation-site-specific NWS current conditions XML file.
		// Save the current time to use as a timestamp for data we will
		// be loading into our database.
		var dlTime = new Date();
		var dl_timestamp = dlTime.getTime();
		enyo.log("NWS current conditions file downloaded successfully.");
		// enyo.log(enyo.json.stringify(inResponse));

      // Hack apart the returned string in Javascript, since I 
		// couldn't figure out how to use xpath on webOS. 
		// var ccLines = inResponse.split("</entry>");

		// var ccLinesCachedLength = ccLines.length;
		// var cachedPrefsLength = this.alertLocations.length;
		// var i;
		// Clean out the current conditions array.
		this.CC.splice(0);
	
		var oneCCLine = inResponse;
		// Lop off beginning of string up to "<entry>".  
		// This fixes a bug with first "<entry>" delimiter in array.
		// oneCCLine = oneCCLine.slice(oneCCLine.indexOf("<entry>"));
		//enyo.log(enyo.json.stringify(oneCCLine));
		var stationId = oneCCLine.slice(oneCCLine.indexOf("<station_id>")+12, oneCCLine.indexOf("</station_id>"));
		enyo.log('stationId: ' + stationId);
		var obsTstamp = oneCCLine.slice(oneCCLine.indexOf("<observation_time_rfc822>")+25, oneCCLine.indexOf("</observation_time_rfc822>"));
		enyo.log('obsTstamp: ' + obsTstamp);
		// if (alertTitle.indexOf('There are no active') < 0)
		var iconURLBase = oneCCLine.slice(oneCCLine.indexOf("<icon_url_base>")+15, oneCCLine.indexOf("</icon_url_base>"));
		var iconURLName = oneCCLine.slice(oneCCLine.indexOf("<icon_url_name>")+15, oneCCLine.indexOf("</icon_url_name>"));
		var iconURL = iconURLBase + iconURLName;
		enyo.log('iconURL: ' + iconURL);
		var tempF = oneCCLine.slice(oneCCLine.indexOf("<temp_f>")+8, oneCCLine.indexOf("</temp_f>"));
		enyo.log('tempF: ' + tempF);
		var tempC = oneCCLine.slice(oneCCLine.indexOf("<temp_c>")+8, oneCCLine.indexOf("</temp_c>"));
		enyo.log('tempC: ' + tempC);
		var weather = oneCCLine.slice(oneCCLine.indexOf("<weather>")+9, oneCCLine.indexOf("</weather>"));
		enyo.log('weather: ' + weather);
		var relativeHumidity =  oneCCLine.slice(oneCCLine.indexOf("<relative_humidity>")+19, oneCCLine.indexOf("</relative_humidity>"));
		enyo.log('relHum: ' + relativeHumidity);
		var windMph = oneCCLine.slice(oneCCLine.indexOf("<wind_mph>")+10, oneCCLine.indexOf("</wind_mph>"));
		var windDir = oneCCLine.slice(oneCCLine.indexOf("<wind_dir>")+10, oneCCLine.indexOf("</wind_dir>"));
		var windDeg = oneCCLine.slice(oneCCLine.indexOf("<wind_degrees>")+14, oneCCLine.indexOf("</wind_degrees>"));
		enyo.log('Wind: ' + windMph + 'mph/' + windDir + '/' + windDeg + 'deg');
		var pressMb = oneCCLine.slice(oneCCLine.indexOf("<pressure_mb>")+13, oneCCLine.indexOf("</pressure_mb>"));
		var pressInches = oneCCLine.slice(oneCCLine.indexOf("<pressure_in>")+13, oneCCLine.indexOf("</pressure_in>"));
		enyo.log('Pressure: ' + pressMb + 'mbar/' + pressInches + 'inches');
		var dewptF = oneCCLine.slice(oneCCLine.indexOf("<dewpoint_f>")+12, oneCCLine.indexOf("</dewpoint_f>"));
		var dewptC = oneCCLine.slice(oneCCLine.indexOf("<dewpoint_c>")+12, oneCCLine.indexOf("</dewpoint_c>"));
		enyo.log('DewPoint: ' + dewptF + 'F/' + dewptC + 'C');
		// heat index doesn't always appear in the file
		var heatIndexF = oneCCLine.slice(oneCCLine.indexOf("<heat_index_f>")+14, oneCCLine.indexOf("</heat_index_f>"));
		var heatIndexC = oneCCLine.slice(oneCCLine.indexOf("<heat_index_c>")+14, oneCCLine.indexOf("</heat_index_c>"));
		enyo.log('heatIndex: ' + heatIndexF + 'F/' + heatIndexC + 'C');
		var windChillF = oneCCLine.slice(oneCCLine.indexOf("<windchill_f>")+14, oneCCLine.indexOf("</windchill_f>"));
		var windChillC = oneCCLine.slice(oneCCLine.indexOf("<windchill_c>")+14, oneCCLine.indexOf("</windchill_c>"));
		enyo.log('Wind Chill: ' + windChillF + 'F/' + windChillC + 'C');
		var visibilityMi = oneCCLine.slice(oneCCLine.indexOf("<visibility_mi>")+15, oneCCLine.indexOf("</visibility_mi>"));
		enyo.log('Visibility: ' + visibilityMi + 'mi');

		this.CC.push({
			id: stationId,
			obs_tstamp: obsTstamp,
			dl_tstamp: dl_timestamp,
			icon_url: iconURL,
			temp_f: tempF,
			temp_c: tempC,
			weather_str: weather,
			relative_hum: relativeHumidity,
			wind_mph: windMph,
			wind_dir: windDir,
			wind_deg: windDeg,
			pressure_mb: pressMb,
			pressure_inches: pressInches,
			dewpt_f: dewptF,
			dewpt_c: dewptC,
			heat_index_f: heatIndexF,
			heat_index_c: heatIndexC,
			wind_chill_f: windChillF,
			wind_chill_c: windChillC,
			visibility_mi: visibilityMi
			});
		// Call storeCC to get data for this state into the database.
		if (this.CC.length > 0)
			{
			this.storeCC();
			}
		/*
		else
			{
			// There weren't any current conditions for this state, move on to the next.
			this.$.dlNWSAlerts.downLoadAlerts();
			}
		*/
	},

	NWS_cc_Failure: function(inSender, inResponse) {
		enyo.log("Failed to download current conditions file.");
	},

	storeCC: function() {
		enyo.log("storing current conditions in database...");

		// Cache the length of our CC array.
		this.ccCachedLength = this.CC.length;
		// enyo.log("CC array cached length: " + this.ccCachedLength);

		this.ccArrayIndex = 0;

		this.wbDB = openDatabase("ext:WeatherBulletinUSADB", "1", "", "25000000");
		// enyo.log("wbDB: " + enyo.json.stringify(this.wbDB));

		for(c=0; c < this.ccCachedLength; c = c + 1) {
			enyo.log("Processing cached current conditions " + (c+1) + " of " + this.ccCachedLength);
			this.CurrentConditionInsert(c);
			}
		// Move on to the next station.
		this.downloadCurrentConditions();
	},

	CurrentConditionInsert: function(i) {
		enyo.log('CurrentConditionInsert called with parameter: ' + i);
		var that = this;
		// Insert current condition row into the observation table
		this.wbDB.transaction(
			function (transaction) {
				transaction.executeSql('INSERT INTO observation(stationId, ' +
																	'obs_tstamp, ' +
																	'dl_stamp, ' +
																	'icon_url, ' +
																	'temp_f, ' +
																	'temp_c, ' +
																	'weather, ' +
																	'relative_humidity, ' +
																	'wind_mph, ' +
																	'wind_dir, ' +
																	'wind_degrees, ' +
																	'pressure_mb, ' +
																	'pressure_inches, ' +
																	'dewpoint_f, ' +
																	'dewpoint_c, ' +
																	'heatindex_f, ' +
																	'heatindex_c, ' +
																	'windchill_f, ' +
																	'windchill_c, ' +
																	'visibility_miles' +
																	') ' +
									'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
									[that.CC[i].id,
									that.CC[i].obs_tstamp, // observation tstamp
									that.CC[i].dl_tstamp, // download tstamp	
									that.CC[i].icon_url, // URL for graphic icon depicting current conditions
									that.CC[i].temp_f, // temperature in farenheit degrees
									that.CC[i].temp_c, // temperature in celsius degrees
									that.CC[i].weather_str, // description of current weather conditions
									that.CC[i].relative_hum, // relative humidity
									that.CC[i].wind_mph, // wind speed in miles per hour
									that.CC[i].wind_dir,	// wind direction as a string
									that.CC[i].wind_deg, // wind direction as a compass heading, in degrees
									that.CC[i].pressure_mb, // atmospheric pressure in millibars
									that.CC[i].pressure_inches, // atmospheric pressure in inches of mercury
									that.CC[i].dewpt_f, // dew point in degrees farenheit
									that.CC[i].dewpt_c, // dew point in degrees celsius
									that.CC[i].heat_index_f, // heat index in degrees farenheit
									that.CC[i].heat_index_c, // heat index in degrees celsius 
									that.CC[i].wind_chill_f, // wind chill in degrees farenheit
									that.CC[i].wind_chill_c, // wind chill in degrees celsius
									that.CC[i].visibility_mi // visibility in miles
									]);
					} 
				);

		}

});
