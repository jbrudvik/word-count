/*
 * Word Count content script
 */

/* global chrome:false, $:false, pluralize:false, PeripheryLabel:false, SelectionListener:false */


/*
 * Instantiate popup and and listeners
 */
var COUNTED_NOUN = 'word';
var popup = new PeripheryLabel(COUNTED_NOUN);

var selectionListener = new SelectionListener(window);

// Listen for selection changes and show/hide the popup based on the number of words selected
$(window).on(SelectionListener.SELECTION_CHANGE_EVENT, function (event) {
  var count = event.selection ? event.selection.wordCount : 0;
  if (!count) {
    popup.hide();
  } else {
    var message = count + ' ' + pluralize(COUNTED_NOUN, count);
    popup.show(message);
  }
});

// Listen for messages from other parts of the extension to start/stop selection listening
chrome.runtime.onMessage.addListener(function (message) {
  if (message.active) {
    selectionListener.start();
  } else {
    selectionListener.stop();
  }
});

// On ESC key down, disable the extension
$(document).on('keydown', function (event) {
  if (event.which === 27) { // ESC key
    chrome.runtime.sendMessage({ active: false });
  }
});
