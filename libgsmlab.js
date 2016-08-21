
var http = require('http');
var fs = require('fs');
var querystring = require('querystring');
var $;
require("jsdom").env("", function(err, window) {
                if (err) {
                        throw err;
                }
                $ = require("jquery")(window);
});

function get_device_info(model_name, callback, options, user_data)
{
        var f_extract = function (response) {
                content = "";
                response.on("data", function(chunk) {
                        content += chunk;
                });

                response.on("end", function() {
                        var jobject = $($.parseHTML(content));
                        var specs_list = jobject.find("div#specs-list");
                        var tables = []
                        specs_list.find("tbody").each(function() {
                                        tables.push($(this));
                                        });

                        // Extract data.
                        var data = {};
                        for (var i = 0; i < tables.length; i ++) {
                                // Find the one that contains "Launch"
                                var res = tables[i].find("*:contains('Launch')");
                                if (res.length > 0) {
                                        var launch = res.parent().parent();
                                        var items = [];
                                        launch.find(".ttl").each(function() {
                                                items.push({cate: $(this).html()});
                                        });
                                        var j = 0;
                                        try {
                                                launch.find(".nfo").each(function() {
                                                        items[j ++].value = $(this).html();
                                                });
                                        } catch (err) {
                                                console.log(launch.html());
                                        }
                                        for (j = 0; j < items.length; j ++) {
                                                if (-1 != items[j].cate.indexOf("Announce")) {
                                                        data.announced = items[j].value;
                                                }
                                                if (-1 != items[j].cate.indexOf("Status")) {
                                                        data.status = items[j].value;
                                                }
                                        }
                                }
                                // Find platform.
                                var res = tables[i].find("*:contains('Platform')");
                                if (res.length > 0) {
                                        data.platform = res.find(".nfo").html();
                                }
                                // Find the one that contains "Misc"
                                res = tables[i].find("*:contains('Misc')");
                                if (res.length > 0) {
                                        var misc = res.parent().parent();
                                        var items = [];
                                        misc.find(".ttl").each(function() {
                                                items.push({cate: $(this).html()});
                                        });
                                        var j = 0;
                                        try {
                                                misc.find(".nfo").each(function() {
                                                        items[j ++].value = $(this).html();
                                                });
                                        } catch (err) {
                                                console.log(misc.html());
                                        }
                                        // Extract Items
                                        for (j = 0; j < items.length; j ++) {
                                                if (-1 != items[j].cate.indexOf("Colors")) {
                                                        data.color = items[j].value;
                                                }
                                                if (-1 != items[j].cate.indexOf("Price")) {
                                                        var sl = items[j].value.indexOf("<span");
                                                        if (sl != -1) {
                                                                data.price = items[j].value.slice(sl + 20, -7);
                                                        }
                                                }
                                        }
                                }
                        }
                        data.DeviceName = model_name;
                        callback(model_name, [data], user_data);
                });
        }
        var req = http.get(options, f_extract).end();
}

function get_device(callback, model_name, user_data)
{
        var query_string = "?sName=" + model_name.toLowerCase().split(" ").join("+") + "&sQuickSearch=yes";
        var options = {
                host: "www.gsmarena.com",
                path: "/results.php3" + query_string,
                method: "GET",
        };

        var content = "";
        var f_response = function(response) {

                response.on("data", function (chunk) {
                        content += chunk;
                });

                response.on("end", function () {
                        var jobject = $($.parseHTML(content));
                        var review = jobject.find("#review-body");
                        var first_a = review.find("a");
                        var link = first_a.attr("href");
                        if (link == null) {
                                // Failed to find such device.
                                callback(model_name, {status: "error"}, user_data);
                                return;
                        } else {
                                // Fetch information about this device.
                                options.path = "/" + link;
                                get_device_info(model_name, callback, options, user_data);
                        }
                });
        }

        var req = http.get(options, f_response).end();
}

module.exports = {
	get_device: get_device,
};
/*
function log(model_name, data)
{
        console.log(data);
}
*/
