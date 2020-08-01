// ==UserScript==
// @name            jqbx+
// @description     Adds missing QoL features to the JQBX website.
// @author          braincomb, fractaldroid
// @homepageURL     https://github.com/fractaldroid/jqbx-plus
// @namespace       https://github.com/fractaldroid/jqbx-plus
// @version         0.1.0
// @include         http*://app.jqbx.fm/room/*
// @require         https://code.jquery.com/jquery-2.1.4.min.js
// @require         https://www.gstatic.com/firebasejs/7.17.1/firebase-app.js
// @require         https://www.gstatic.com/firebasejs/7.17.1/firebase-analytics.js
// @require         https://www.gstatic.com/firebasejs/7.17.1/firebase-firestore.js
// @require         https://www.gstatic.com/firebasejs/7.17.1/firebase-auth.js
// @grant           GM_registerMenuCommand
// @grant           GM_addStyle
// ==/UserScript==

/* globals jQuery */

GM_addStyle(`
  .emoji-component {
    right: 202px !important;
  }

  #tenor-btn {
    position: absolute;
    top: 0;
    right: 102px;
    height: 100%;
    width: 100px;
    outline: none;
    border: none;
    background: #0d1318;
    cursor: pointer;
    text-transform: uppercase;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #7f9293;
    transition: color .5s,background .5s;
    transform: translateZ(0);
  }

  #gif-search-container {
    display: none;
    width: 100%;
    height: 100%;
    position: relative;
    background-color: #0b1015;
    top: 0;
    left: 0;
  }

  #gif-search-input {
    background-color: black;
    border-color: #CCC;
    margin: 10px;
  }
`);

const TRIGGER_NOT_FOUND_MESSAGES = [
  "Bless up. trigger not found: ",
  "Oops! Not a trigger: ",
  "This trigger is single and looking: ",
  "/me wishes there was a trigger for: ",
  "I must be thinking of another trigger, not: ",
  "Not a trigger, bro: ",
  "That's not a trigger: ",
  "I wish it was a trigger too, but it's not: ",
  "That'd make a good trigger, but it's not one: "
];
const INVISIBLE_CHAR = "‎";
const MIN_TRIGGER_LENGTH = 3;
const FIRE_BASE_CONFIG = {
  apiKey: "AIzaSyAbtDoQbfpUfXgaf6de2FyZqKIgXndW_Oo",
  authDomain: "jqbx-plus-triggers.firebaseapp.com",
  databaseURL: "https://jqbx-plus-triggers.firebaseio.com",
  projectId: "jqbx-plus-triggers",
  storageBucket: "jqbx-plus-triggers.appspot.com",
  messagingSenderId: "296173927183",
  appId: "1:296173927183:web:bba13c94db965d17881c7a",
  measurementId: "G-HZBDG2SVM8"
};

firebase.initializeApp(FIRE_BASE_CONFIG);
firebase.analytics();
/*
  firebase.auth().signInWithEmailAndPassword('poopypants@github.io', '').catch(function (error) {
    var errorCode = error.code;
    var errorMessage = error.message;
  });
*/
// Instantiate firestore
const db = firebase.firestore();

// Button stuff
jQuery(document).ready(function () {
  setTimeout(function () {
    jQuery("#chat-input-form").append('<button id="tenor-btn" type="submit">GIF</button>');
    jQuery('#chat-messages').append('<div id="gif-search-container"><div id="gif-search-input"><input type="text"/></div></div>');
    handleGifSearch();
  }, 5000);

  var searchContainerElem = jQuery('<div id="gif-search-container"></div>');
  function handleGifSearch() {
    jQuery('#tenor-btn').click(function () {
      jQuery('#gif-search-container').toggle();
    })
  }
});

// MAIN
(function () {
  // WebSocket monkey patching solution via StackOverflow @ https://stackoverflow.com/a/31182643
  var OrigWebSocket = window.WebSocket;
  var callWebSocket = OrigWebSocket.apply.bind(OrigWebSocket);
  var wsAddListener = OrigWebSocket.prototype.addEventListener;
  wsAddListener = wsAddListener.call.bind(wsAddListener);
  window.WebSocket = function WebSocket(url, protocols) {
    var ws;
    if (!(this instanceof WebSocket)) {
      // Called without 'new' (browsers will throw an error).
      ws = callWebSocket(this, arguments);
    } else if (arguments.length === 1) {
      ws = new OrigWebSocket(url);
    } else if (arguments.length >= 2) {
      ws = new OrigWebSocket(url, protocols);
    } else { // No arguments (browsers will throw an error)
      ws = new OrigWebSocket();
    }

    wsAddListener(ws, 'message', function (event) {
      // TODO: Do something with event.data (received data) if you wish.
      console.log(event.data);
      console.log("event data");
      // TODO: check if it's a push-message
    });
    return ws;
  }.bind();
  window.WebSocket.prototype = OrigWebSocket.prototype;
  window.WebSocket.prototype.constructor = window.WebSocket;

  var wsSend = OrigWebSocket.prototype.send;
  wsSend = wsSend.apply.bind(wsSend);

  // Modify WebSocket client send messages
  OrigWebSocket.prototype.send = async function (data) {
    Array.prototype.random = function () {
      return this[Math.floor((Math.random() * this.length))];
    }
    var magicCacheBusterStr = INVISIBLE_CHAR.repeat(Math.floor(Math.random() * 100));
    // Check if the Websocket Message is a "chat" client-to-server message
    if (data.substr(0, 2) == "42") {
      // Mp4 embedder
      checkAndConvertToEmbed();
      // Demoleuculariziation of the data
      var dataObj = JSON.parse(data.substr(2));
      if (dataObj.length > 1) {
        // Check if the message starts with ! as these are triggers
        if (dataObj[1].hasOwnProperty('message') && dataObj[1].message.hasOwnProperty('message') && (dataObj[1].message.message.substr(0, 1) == "!")) {
          var triggerDocId = dataObj[1].message.message.substr(1);
          // Check if delete operation
          if ((dataObj[1].message.message.split(" ").length > 1) && (triggerDocId.split(" ")[0] == "del")) {
            console.log("it's a delete");
            var actualTriggerDocId = triggerDocId.split(" ")[1];
            await db.collection("trigger_col").doc(actualTriggerDocId).get().then(function (doc) {
              if (doc.exists) {
                db.collection("trigger_col").doc(actualTriggerDocId).delete()
                  .catch(function (error) {
                    console.log("Error getting document:", error);
                  });
                dataObj[1].message.message = "removed trigger: " + actualTriggerDocId;
                // Reconstruct the WebSocket message now
                data = "42" + JSON.stringify(dataObj);
              } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
                dataObj[1].message.message = TRIGGER_NOT_FOUND_MESSAGES.random() + triggerDocId + magicCacheBusterStr;
                data = "42" + JSON.stringify(dataObj);
              }
            }).catch(function (error) {
              console.log("Error getting document:", error);
            });
          }
          // Check if add/update and the val is more than MIN_TRIGGER_LENGTH characters
          else if ((dataObj[1].message.message.split(" ").length > 1) && (triggerDocId.split(" ")[1].length > MIN_TRIGGER_LENGTH)) {
            triggerDocId = triggerDocId.split(" ")[0];
            // Construct the Firebase request data
            var triggerVal = { "val": dataObj[1].message.message.split(" ").slice(1).join(" ") };;
            await db.collection("trigger_col").doc(triggerDocId.split(" ")[0]).set(triggerVal)
              .then(function (docRef) {
                var val = triggerVal.val
                console.log(triggerDocId + " has been set/updated to " + val);
                dataObj[1].message.message = "updated trigger for !" + triggerDocId;
                // Construct the WebSocket message now
                data = "42" + JSON.stringify(dataObj);
              })
              .catch(function (error) {
                console.error("Error adding document: ", error);
              });
            // Not add/update, so try to GET the trigger val from Firebase
          } else if (!(dataObj[1].message.message.split(" ").length > 1)) {
            // Easter egg TODO
            if (triggerDocId == "mandalas") {
              var random_int_0_to_30 = [0, 1, 2, 3].map(multiplyByRandom);
            }
            // We need to fetch the trigger val from Firebase here so using await
            await db.collection("trigger_col").doc(triggerDocId).get().then(function (doc) {
              if (doc.exists) {
                var val = doc.data().val; // data == {"val":"something"}
                // Reconstruct message string with url & magic cachebuster
                dataObj[1].message.message = "!" + triggerDocId + magicCacheBusterStr + " " + val;
                // Reconstruct the WebSocket message now
                data = "42" + JSON.stringify(dataObj);
              } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
                dataObj[1].message.message = TRIGGER_NOT_FOUND_MESSAGES.random() + triggerDocId + magicCacheBusterStr;
                data = "42" + JSON.stringify(dataObj);
              }
            }).catch(function (error) {
              console.log("Error getting document:", error);
            });
          }
        }
      }
    } else {
      //console.log("Other Websocket shit" + data);
    }
    return wsSend(this, arguments);
    triggerDocId = "";
    dataObj = {};
    data = null;
  };
})();


function checkAndConvertToEmbed() {
  setTimeout(function () {
    // Find the last message that contains an a href
    let linkEl = jQuery('#chat-messages > div > ul > li:last-child p a');
    // Make sure it's an mp4 href and the parent div doesn't have a video elem
    if (linkEl.length > 0 && linkEl.attr('href').endsWith('mp4') && linkEl.attr('href') && jQuery('#chat-messages > div > ul > li:last-child p').has('video').length == 0) {
      var linkValue = linkEl.attr('href');
      jQuery('<p class="content"><video autoplay loop><source src="' + linkValue + '" type="video/mp4"/></video></p>').insertAfter('#chat-messages > div > ul > li:last-child p');
    }
  }, 150);
}

function multiplyByRandom(n) {
  return (n * Math.floor(Math.random() * 10));
}
