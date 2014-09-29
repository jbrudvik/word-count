/*
 * Word Count content script
 */

/* global chrome:false, $:false, _:false, pluralize:false */
/* jshint bitwise:false */


/*
 * Constants
 */
var ESCAPE_KEY = 27;
var SELECTION_CHANGE_EVENT = 'selectionChange';
var COUNTED_NOUN = 'word';


/*
 * Functions for counting characters and words in selections and strings
 */
var textCount = {

  /*
   * Return the number of visible words in a string
   */
  wordCountInString: function (s) {
    if (!s || !s.length) {
      return 0;
    }

    // Consider a groups of newline whitespace to be one space each
    s = s.replace(/[\n\r]+/g, ' ');

    // Strip out control characters
    s = s.replace(/[\x00-\x1f]/g, '');

    // Remove leading and trailing whitespace, to be safe
    s = s.trim();

    // Split string on all whitespace into words
    var words = s.split(/\s+/);

    // Filter out falsy contents (e.g., empty words)
    words = _.compact(words);

    return words.length;
  },

  /*
   * Return the number of visible characters in a string
   */
  characterCountInString: function(s) {
    if (!s || !s.length) {
      return 0;
    }

    // Consider a groups of newline whitespace to be one space each
    s = s.replace(/[\n\r]+/g, ' ');

    // Strip out control characters
    s = s.replace(/[\x00-\x1f]/g, '');

    return s.length;
  },

  /*
   * Return the number of words in a selection
   */
  wordCountInSelection: function (selection) {
    var text = selection.toString();
    return this.wordCountInString(text);
  },

  /*
   * Return the number of characters in a selection
   */
  characterCountInSelection: function (selection) {
    var text = selection.toString();
    var count = this.characterCountInString(text);

    // Fix naive count in corner cases

    var anchorNode = selection.anchorNode; // node containing start of selection
    var focusNode = selection.focusNode; // node containing end of selection

    // If focus node is a text node, considerly slightly more accurate counting approaches
    if (focusNode.nodeType === Node.TEXT_NODE) {

      // If the anchor node and the focus node are the same, the count of words
      // selected is the absolute difference of the anchor and focus offsets
      if (anchorNode === focusNode) {
        return Math.abs(selection.focusOffset - selection.anchorOffset);
      }

      // If focus node follows anchor node, selection.toString() sometimes includes
      // trailing whitespace even if it isn't selected. Decrease count by one if there
      // is a discrepancy with focusOffset.
      if (anchorNode.compareDocumentPosition(focusNode) & Node.DOCUMENT_POSITION_FOLLOWING) {
        if (focusNode.data[selection.focusOffset - 1] !== text[text.length - 1]) {
          return count - 1;
        }
      }

      // If focus node trails anchor node, selection.toString() sometimes fails
      // to include leading whitespace, even if it selected. Increase count by
      // one if there is a discrepancy with focusOffset.
      if (focusNode.compareDocumentPosition(anchorNode) & Node.DOCUMENT_POSITION_FOLLOWING) {
        var leadingCharacter = focusNode.data[selection.focusOffset];
        if (leadingCharacter && leadingCharacter !== text[0] && leadingCharacter === ' ') {
            return count + 1;
        }
      }
    }

    return count;
  }
};


/*
 * Creates and controls an element that displays word count information
 *
 * Parameters:
 * - noun (string): The noun being counted. Will be displayed in popup. (default: undefined)
 * - pluralize (boolean): Option to attempt to pluralize noun when appropriate (default: true)
 */
function CountPopup(noun, pluralize) {
  this.noun = noun;
  this.pluralize = (pluralize !== undefined) ? pluralize : true;

  this.$popup = $('<div>', { id: 'word-count-popup' }).css({
    'position': 'fixed',
    'z-index': 2147483647,
    'top': 0,
    'right': 0,
    'width': 'auto',
    'height': 'auto',
    'margin': 0,
    'padding': '6px',
    'border': 'none',
    'outline': 'none',
    'box-shadow': 'none',
    'background-color': 'rgba(255, 255, 255, 0.8)',
    'color': '#333',
    'font-family': 'Menlo, Consolas, "Liberation Mono", monospace',
    'font-size': '14px',
    'line-height': 1,
    'text-decoration': 'none',
    'vertical-align': 'baseline',
    'user-select': 'none',
    'pointer-events': 'none',
    'border-radius': 0
  });

  this.namespace = 'CountPopup';
  this.isShowing = false;
}

/*
 * Ensure the popup is located at top of window.
 *
 * Fixed CSS positioning does not always hold, so force the correct absolute
 * position if necessary.
 */
CountPopup.prototype.setToWindowTop = function () {
  var popupTop = this.$popup.offset().top;
  var scrollTop = window.scrollY;
  if (popupTop !== scrollTop && scrollTop >= 0) {
    this.$popup.css({
      'position': 'absolute',
      'top': scrollTop
    });
  }
};

/*
 * Return message for given count (required)
 */
CountPopup.prototype.getMessageForCount = function (count) {
  var message = '' + count;
  if (this.noun) {
    message += ' ' + pluralize(this.noun, this.pluralize ? count : 1);
  }
  return message;
};

/*
 * Display word count popup with given count.
 *
 * If count is undefined or 0, popup will be hidden.
 */
CountPopup.prototype.show = function (count) {
  if (!count) {
    this.hide();
  } else {
    var message = this.getMessageForCount(count);
    this.$popup.html(message);

    if (!this.isShowing) {
      this.isShowing = true;

      this.$popup.appendTo(document.body);
      this.setToWindowTop();

      // When scrolling, ensure that popup stays where it should be
      var self = this;
      $(window).on('scroll.' + this.namespace, function () {
        self.setToWindowTop();
      });
    }
  }
};

/*
 * Hide word count popup
 */
CountPopup.prototype.hide = function () {
  // When hidden, don't listen to scroll events to limit performance impact
  $(window).off('scroll.' + this.namespace);
  this.$popup.remove();
  this.isShowing = false;
};


/*
 * An object for observing and comparing current text selections.
 *
 * When instantiated, captures the current selection and computes a count
 * of words selected.
 *
 * May be compared for equality against other EquatableSelection instances.
 *
 * Should be treated as immutable.
 */
function EquatableSelection() {
  var selection = window.getSelection();
  if (selection && selection.rangeCount === 1) {
    this.text = selection.toString();
    this.wordCount = textCount.wordCountInSelection(selection);
    this.characterCount = textCount.characterCountInSelection(selection);
  }
}

/*
 * Return true if two EquatableSelection objects are equal, false otherwise
 */
EquatableSelection.prototype.isEqual = function (other) {
  return other &&
    this.wordCount === other.wordCount &&
    this.characterCount === other.characterCount &&
    this.text === other.text;
};


/*
 * An object that listens for selection changes on a target object and triggers
 * a custom jQuery 'selectionChange' event when changes are observed.
 *
 * Observes changes using EquatableSelection.
 *
 * Triggered selectionChange events contain a `selection` property containing an
 * EquatableSelection if a selection exists. In the case of a previously-selected
 * selection being unselected, the triggered selectionChange event will not contain
 * a `selection` property.
 */
function SelectionListener(target) {
  this.target = target;

  // An internal event used to force extra selection change checks
  this.SELECTION_CHANGE_IMMINENT_EVENT = 'selectionChangeImminent';

  // Events which may indicate selection changes
  this.events = [
    'mousemove',
    'mousedown',
    'mouseup',
    'keydown',
    'keyup',
    'scroll',
    this.SELECTION_CHANGE_IMMINENT_EVENT
  ];

  this.namespace = 'SelectionListener';
  this.isListening = false;
}

/*
 * Handle events and check for selection changes.
 *
 * Trigger selectionChange event if a selection change has occurred.
 */
SelectionListener.prototype.handleEvent = function (event) {
  var current = new EquatableSelection();

  if (current) {
    if (!current.isEqual(this.previous)) {
      // Trigger a selectionChange event if this selection is not equal to
      // the previously-observed selection
      $(this.target).trigger({
        type: SELECTION_CHANGE_EVENT,
        selection: current
      });
      this.previous = current;
    }
  } else if (this.previous) {
    // Trigger empty event to signify that a selection has been "unselected"
    $(this.target).trigger(SELECTION_CHANGE_EVENT);
    this.previous = null;
  }

  // Mouse clicks can cause selections to change, but the selection change
  // might not have completed yet. Check again shortly.
  if (event && (event.type === 'mousedown' || event.type === 'mouseup')) {
    var self = this;
    setTimeout(function () {
      $(self.target).trigger(self.SELECTION_CHANGE_IMMINENT_EVENT);
    }, 20);
  }
};

/*
 * Start listening for selection changes.
 *
 * If there is an existing selection when this method is called, a
 * selectionChange event will be immediately triggered.
 */
SelectionListener.prototype.start = function () {
  if (!this.isListening) {
    _.each(this.events, function (event) {
      $(this.target).on(event + '.' + this.namespace, this.handleEvent.bind(this));
    }, this);
    this.isListening = true;

    // Check for existing seletion immediately
    $(this.target).trigger(this.SELECTION_CHANGE_IMMINENT_EVENT);
  }
};

/*
 * Stop listening for selection changes.
 *
 * One empty selectionChange event is immediately triggered.
 */
SelectionListener.prototype.stop = function () {
  if (this.isListening) {
    $(this.target).trigger(SELECTION_CHANGE_EVENT);
    this.previous = null;

    _.each(this.events, function (event) {
      $(this.target).off(event + '.' + this.namespace);
    }, this);
    this.isListening = false;
  }
};

/*
 * Toggle listening for selection changes.
 */
SelectionListener.prototype.toggle = function () {
  if (this.isListening) {
    this.stop();
  } else {
    this.start();
  }
};


/*
 * Instantiate popup and and listeners
 */
var target = window;
var popup = new CountPopup(COUNTED_NOUN);
var selectionListener = new SelectionListener(target);

// Listen for selection changes and show/hide the popup based on the number of
// words selected
$(target).on(SELECTION_CHANGE_EVENT, function (event) {
  var count = event.selection ? event.selection.wordCount : 0;
  popup.show(count);
});

// Listen for messages from other parts of the extension to start/stop selection listening
chrome.runtime.onMessage.addListener(function (message) {
  if (message.active) {
    selectionListener.start();
  } else {
    selectionListener.stop();
  }
});

// On escape key down, disable the extension
$(document).on('keydown', function (event) {
  if (event.which === ESCAPE_KEY) {
    chrome.runtime.sendMessage({ active: false });
  }
});
