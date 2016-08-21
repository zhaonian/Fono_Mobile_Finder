var fonoapi = require("./libfono.js");
var gsmlab = require("./libgsmlab.js");
var burry = require("./libburry.js");
var fs = require("fs");
var sleep = require("system-sleep");
fonoapi.token = 'edddf964184b249f8c47753a0c1c534069fce0f1af810925';

var testModelStrings = [];
var all_data = [];


function my_console_log(model_name, data, i)
{
        var extracted;
        if (data.status != 'error') {
                extracted = data;
                console.log("Fetched " + i + " " + model_name);
        } else {
                extracted = [{DeviceName: model_name, is_failed: true}];
        }
        if (all_data[i] == null) {
                all_data[i] = {model: model_name, data: extracted};
        } else {
                // Merge.
                console.log("Merging " + model_name);
                for (var k = 0; k < extracted.length; k ++) {
                        var has_match = false;
                        for (var j = 0; j < all_data[i].data.length; j ++) {
                                if (extracted[k].DeviceName == all_data[i].data[j].DeviceName) {
                                        has_match = true;
                                        for (var prop in extracted[k]) {
                                                if (all_data[i].data[j].prop == null) {
                                                        all_data[i].data[j][prop] = extracted[k][prop];
                                                }
                                        }
                                }
                        }
                        if (!has_match) {
                                all_data[i].data.push(extracted[k]);
                        }
                }
        }
}

function read_input_csv(CSV_file) 
{
        var data = fs.readFileSync(CSV_file).toString();
                if (data == null) {
                        throw new Error ("ERROR!!!!!");
                }
                var lines = data.split("\n");
                for (var i = 1; i < lines.length; i ++) {
                        var parts = lines[i].split(",");
                        if (parts[0] != "")
                                testModelStrings.push(parts[0]);
                }
                
}

function write_output_csv(file_name)
{
        // First line.
        fs.appendFile("phone.csv", "model, price, weight, device name, brand, touch screen, announced date, CPU\n");

        // Data.
        var n_missed = 0;
        for (var i = 0; i < all_data.length; i ++) {
                if (all_data[i] == null) {
                        console.log("Missing " + i);
                        continue;
                }
                if (all_data[i].data != null) {
                        // Has such device.
                        var data = all_data[i].data;

                        // Find best match.
                        var target = all_data[i].model;
                        var array = [];
                        var k;
                        for (k = 0; k < data.length; k ++) {
                                array.push(data[k].DeviceName);
                        }
                        k = burry.find_best_match(array, target);

                        // Write result to file.
                        fs.appendFile(file_name, all_data[i].model.split(",").join(" ") + ","
                                        + (data[k].price != null ?              data[k].price.split(",").join(" ") : "don't know") + "," 
                                        + (data[k].weight != null ?             data[k].weight.split(",").join(" ") : "don't know") + "," 
                                        + (data[k].DeviceName != null ?         data[k].DeviceName.split(",").join(" ") : "don't know") + "," 
                                        + (data[k].Brand != null ?              data[k].Brand.split(",").join(" ") : "don't know") + "," 
                                        + (data[k].multitouch != null ?         data[k].multitouch.split(",").join(" ") : "don't know") + ","
                                        + (data[k].announced != null ?          data[k].announced.split(",").join(" ") : "don't know") + ","
                                        + (data[k].cpu != null ?                data[k].cpu.split(",").join(" ") : "don't know") + "\n");
                        if (data[k].is_failed)
                                n_missed ++;
                }
        }
        
        console.log("ratio: " + (all_data.length - n_missed)/all_data.length*100 + "%");
}

// Main.
const input_file_name = "fake_list.csv";
const output_file_name = "phone.csv";


// Remove output file.
try {
        fs.unlinkSync(output_file_name);
} catch (err) {
        console.log("First time running this program");
}

// Read input file into testModelStrings.
read_input_csv(input_file_name);

// Fetch interval in ms.
const interval = 100;
var id;
var j = 0;
var k = 0;

function output()
{
        console.log("Generating output file: " + output_file_name);
        write_output_csv(output_file_name);
        console.log("Finished");
}


function fetch2()
{
        if (k < testModelStrings.length) {
                gsmlab.get_device(my_console_log, testModelStrings[k], k);
                k ++;
        } else {
                console.log("Finished second_pass fetch from GSMLAB.");
                setTimeout(output, 5000);
                
                // Finished second pass.
                clearInterval(id);
        }
}

function fetch()
{
        if (j < testModelStrings.length) {
                fonoapi.getDevices(my_console_log, testModelStrings[j], j);
                j ++;
        } else {
                console.log("Finished first-pass fetch from FONO.");
                console.log("Started second-pass fetch from GSMLAB.");

                // Start second pass.
                clearInterval(id);
                id = setInterval(fetch2, interval);
        }
}

console.log("Started first-pass fetch from FONO.");
id = setInterval(fetch, interval);
