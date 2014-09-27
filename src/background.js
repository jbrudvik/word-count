/*
 * Word Count background script
 */

/* global chrome:false */


/*
 * An object that keeps track of extension state, sets browser action UI, and
 * communicates with underlying tab content scripts.
 *
 * Abstracts away per-tab state from invoking code. While all public methods
 * can take a tabId as a method parameter, it is not required. Without the
 * tabId parameter, the methods implicitly assume the current tab.
 *
 * Extension state is maintained separately for each browser tab. The browser
 * action button reflects (and controls) the state of only the current tab.
 *
 * On page loads, the tab will keep its state (reloading the tab in content
 * script if necessary).
 */
function WordCount() {
  // Icons and titles (true -> active, false -> inactive)
  var manifest = chrome.runtime.getManifest();
  this.icons = {
    true: {
      '19': 'icons/active-19.png',
      '38': 'icons/active-38.png'
    },
    false: manifest.browser_action.default_icon
  };
  this.titles = {
    true: 'Hide number of words selected',
    false: manifest.browser_action.default_title
  };

  // A set of active tab ids (dictionary with key: tabId, value: true)
  this.activeTabs = {};

  /*
   * Tab UI event listeners
   */
  var self = this;

  // On page loads (and other tab updates), restore active tabs
  chrome.tabs.onUpdated.addListener(function () {
    self.getState(function (state) {
      if (state) {
        self.setState(state);
      }
    });
  });

  // When a tab is removed (either by tab close or window close), forget about it
  chrome.tabs.onRemoved.addListener(function (tabId) {
    self.setState(false, tabId);
  });
}

/*
 * Get the extension state for a tab via single-parameter callback.
 *
 * Tab may be specified by trailing optional parameter. If not, current tab
 * is assumed.
 */
WordCount.prototype.getState = function (callback, tabId) {
  if (!tabId) {
    var self = this;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      callback(tabs[0].id in self.activeTabs);
    });
  } else {
    callback(tabId in this.activeTabs);
  }
};

/*
 * Set the extension state for a tab.
 *
 * Tab may be specified by trailing optional parameter. If not, current tab
 * is assumed.
 */
WordCount.prototype.setState = function (state, tabId) {
  var self = this;
  if (!tabId) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tabId = tabs[0].id;
      if (tabId) {
        self.setState(state, tabId);
      } // else: no tab specified nor a current tab. Ignore set attempt.
    });
  } else {
    chrome.tabs.get(tabId, function (tab) {
      if (tab) { // Only modify tab if it exists
        // Set icon and title
        chrome.browserAction.setIcon({
          path: self.icons[state],
          tabId: tabId
        });
        chrome.browserAction.setTitle({
          title: self.titles[state],
          tabId: tabId
        });

        // Message active state to tab content script
        chrome.tabs.sendMessage(tabId, { active: state });
      }
    });

    // Track tab state
    if (state) {
      this.activeTabs[tabId] = true;
    } else {
      delete this.activeTabs[tabId];
    }
  }
};

/*
 * Toggle the extension state for a tab.
 *
 * Tab may be specified by trailing optional parameter. If not, current tab
 * is assumed.
 */
WordCount.prototype.toggleState = function (tabId) {
  var self = this;
  this.getState(function (state) {
    self.setState(!state, tabId);
  }, tabId);
};


/*
 * Initialize extension and listeners
 */
var wc = new WordCount();

// When the browser action button is clicked, toggle the extension state
chrome.browserAction.onClicked.addListener(function () {
  wc.toggleState();
});

// Listen for messages from the extension to set extension state
chrome.runtime.onMessage.addListener(function (message) {
  wc.setState(!!message.active);
});
