const fs = require('fs');
const fetch = require('node-fetch');

//var jqbx_triggers = fs.readFileSync('triggers_dict.json');
const jqbx_triggers = fs.readFileSync('triggers_dict_sm.json');
const triggersDict = JSON.parse(jqbx_triggers);

// helpers
function validURL(str) {
	var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
	  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
	  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
	  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
	  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
	  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
	return !!pattern.test(str);
  }

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
// Get the size of an object
//var size = Object.size(myObj);


var newTriggersDict = {};
function buildNewTriggersDict() {
	// response will evaluate as the resolved value of the promise
	for (item in triggersDict) {
		//validUrl = validURL(triggersDict[item]);
		fetch(triggersDict[item])
		.then(res => {
			if(res.redirected) {  // https://www.npmjs.com/package/node-fetch#responseredirected
				console.log("302-redirected: ", res.url);
			} else {
				newTriggersDict[item] = triggersDict[item];
				console.log("newTriggersDict is ", newTriggersDict);
			}
		})
		.catch(err => console.error("Error, probably not a URL"));
	}
}
// MAIN
buildNewTriggersDict();

// Write the data to a file
// let data = JSON.stringify(newTriggersDict);
// fs.writeFileSync('newTriggers.json', data);
// console.log("@@ END @@");
