const fs = require('fs');
const request = require('request');

var jqbx_triggers = fs.readFileSync('triggers_dict_sm.json');
//var triggers_sm = fs.readFileSync('triggers-sm.json');
var triggersDict = JSON.parse(jqbx_triggers);

// Helper
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

// Get the size of an object
//var size = Object.size(myObj);

for(item in triggersDict) {
	var r = request(triggersDict[item], function (e, response) {
	  console.log(r.uri);
	  console.log(response.request.uri)
	});
	r();
}
