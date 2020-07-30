// ==UserScript==
// @name            jqbx+
// @description     Adds missing QoL features to the JQBX website.
// @author          braincomb, fractaldroid
// @homepageURL     https://github.com/fractaldroid/jqbx-plus
// @namespace       https://github.com/fractaldroid/jqbx-plus
// @version         0.0.3
// @include         http*://app.jqbx.fm/room/*
// @require         https://code.jquery.com/jquery-2.1.4.min.js
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

var triggerObj = [];
jQuery(document).ready(function() {
  setTimeout(function() {
    jQuery("#chat-input-form").append('<button id="tenor-btn" type="submit">GIF</button>');
    jQuery('#chat-messages').append('<div id="gif-search-container"><div id="gif-search-input"><input type="text"/></div></div>');
    handleGifSearch();
  }, 5000);

  // Get the Triggers JSON dictionary
  fetch('https://raw.githubusercontent.com/fractaldroid/jqbx-plus/master/triggers_dict.json', {cache: "no-cache"})
    .then(
      function(response) {
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' +
            response.status);
          return;
        }

        // Examine the text in the response
        response.json().then(function(data) {
          triggerObj = data;
        });
      }
    )
    .catch(function(err) {
      console.log('Fetch Error :-S', err);
    });

    var searchContainerElem= jQuery('<div id="gif-search-container"></div>');
    function handleGifSearch() {
      jQuery('#tenor-btn').click(function() {
        jQuery('#gif-search-container').toggle();
      })
    }
});

// Credit to Rob W for parts of this code, answered on StackOverflow @ https://stackoverflow.com/a/31182643
// BUG: Currently, if the same !trigger message is sent, it does not send
(function() {
  Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
  }
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

    wsAddListener(ws, 'message', function(event) {
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
  OrigWebSocket.prototype.send = function(data) {
    // Check if the Websocket Message is a "chat" client-to-server message
    if (data.substr(0, 2) == "42") {
      checkAndConvertToEmbed();
      // Demoleuculariziation of the data
      var dataObj = JSON.parse(data.substr(2));
      if (dataObj.length > 1) {
        if (dataObj[1].hasOwnProperty('message')) {
          if (dataObj[1].message.hasOwnProperty('message')) {
            // Check if the message starts with ! as these is a trigger, then check if it exists in the triggers dictionary
            if (dataObj[1].message.message.substr(0, 1) == "!") {
              var triggerString = dataObj[1].message.message.substr(1);
              if (triggerObj[triggerString]) {
                var invisibleChar = "‎";
                var magicCacheBuster = invisibleChar.repeat(Math.floor(Math.random() * 20));
                dataObj[1].message.message = "!" + triggerString + magicCacheBuster + " " + triggerObj[triggerString];
              }
              // Reconstruct the Websocket message now
              data = "42" + JSON.stringify(dataObj);
            }
          }
        }
      } else {
        console.log("Other Websocket shit" + data);
      }
      return wsSend(this, arguments);
      triggerString = "";
      dataObj = {};
      data = null;
    }
  };
})();

// It goes exactly like this: https://i.imgur.com/LJzLNWO.gif
function checkAndConvertToEmbed() {
  setTimeout(function() {
    // Find the last message that contains an a href
    let linkEl = jQuery('#chat-messages > div > ul > li:last-child p a');
      // Make sure it's an mp4 href and the parent div doesn't
      if (linkEl.length > 0 && linkEl.attr('href').endsWith('mp4') && linkEl.attr('href') && jQuery('#chat-messages > div > ul > li:last-child p').has('video').length == 0) {
        var linkValue = linkEl.attr('href');
        jQuery('<p class="content"><video autoplay loop><source src="' + linkValue + '" type="video/mp4"/></video></p>').insertAfter('#chat-messages > div > ul > li:last-child p');
      }
  }, 150);
}
