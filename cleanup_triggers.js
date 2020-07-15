const fs = require('fs');
const request = require('request');
const rp = require('request-promise');

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


newTriggersDict = {}
async function buildNewTriggersDict() {
	// response will evaluate as the resolved value of the promise
	for (item in triggersDict) {
		console.log(item);
		const response = await rp(triggersDict[item]);
		console.log(response);
		if (response.request.uri.path == "/removed.png") {
			constole.log(item + " is removed from Imgur");
		} else {
			newTriggersDict[item] = triggersDict[item];
		}
	}
}

// We can't use await outside of async function.
// We need to use then callbacks ....
buildNewTriggersDict()
	.then(() => console.log("newTriggersDict is "))
	.catch(err => console.log("error"));