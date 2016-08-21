var httpreq = require("httpreq");


function getDevices(callback, device, user_data) {
	var url = 'https://fonoapi.freshpixl.com/v1/getdevice';
	var options = {
		parameters: {device: device, token: module.exports.token},
                timeout: 10000 
	};

	httpreq.post(url, options, function (err, res) {
         
		if (err) {
			console.log(err);
		} else {
                        try {
                                var data = JSON.parse(res.body);
                                // var queryString = brand ? (brand + '.' + device) : device;
                                callback(device, data, user_data);
                        } catch(err) {
                                console.log(err);
                                console.log(device + " failed to return body");
                        }
		}
	});
        /* var f_extract = function(response) {
                console.log(response);
                var content = "";

                response.on("data", function(chunk) {
                        content += chunk;
                });

                response.on("end", function() {
                        try {
                                var data = JSON.parse(content);
                                var queryString = brand ? (brand + '.' + device) : device;
                                callback(queryString, data, user_data);
                        } catch(err) {
                                console.log(device + " failed to return body");
                        }
                });
        };

        var req = https.post(options, f_extract).end(); */
}

function getLatest(callback, limit, brand) {
	var url = 'https://fonoapi.freshpixl.com/v1/getlatest';
	var options = {
		parameters: {token: module.exports.token},
		timeout: 2900
	};
	if (brand) {
		options.parameters.brand = brand;
	}
	if (limit) {
		options.parameters.limit = limit;
	}

	httpreq.post(url, options, function (err, res) {
		if (err) {
			console.log(err);
		} else {
			var data = JSON.parse(res.body);
			var queryString = brand ? brand : '';
			callback(queryString, data);
		}
	});
}

function printCount(queryString, data) {
	printData(queryString, data, false);
}

function printAllNames(queryString, data) {
	printData(queryString, data, true);
}

function printData(queryString, data, printAllData) {
	var outStr = '- "' + queryString + '"\t => ';

	if (data.hasOwnProperty('length')) {
		console.log(outStr + data.length + ' devices');

		if (printAllData) {
			data.forEach(function (device) {
				console.log(device.DeviceName);
                                console.log(device.weight);
			});
			console.log('---');
		}
	} else if (data.hasOwnProperty('message')) {
		console.log(outStr + data.message);
	} else {
		console.log(outStr + ' invalid data: ' + JSON.stringify(data));
	}
}

module.exports = {
	token: '',
	getDevices: getDevices,
	getLatest: getLatest,

	printCount: printCount,
	printAllNames: printAllNames
};
