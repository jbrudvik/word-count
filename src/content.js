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
   * Regex matching at least one "alphanumeric" character.
   *
   * Includes extended Latin, Greek, Coptic, Cyrillic, Armenian, Hebrew, Syriac, Arabic.
   */
  containsAlphanumericCharacterRegex: new RegExp('[a-zA-Z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u024F\u0374-\u058F\u05D0-\u05F4\u0622-\u0669\u066E-\u06D3\u06D5\u06EE-\u06FF\u0710-\u072F\u074D-\u074F\u0750-\u077F]+'),

  /*
   * Return true if string parameter contains at least one "alphanumeric" character.
   */
  containsAlphanumericCharacter: function (s) {
    return this.containsAlphanumericCharacterRegex.test(s);
  },

  /*
   * Return the number of visible words in a string.
   *
   * Words contain at least one alphanumeric character.
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

    // Keep only words containing at least on alphanumeric character
    words = _.filter(words, this.containsAlphanumericCharacter.bind(this));

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
 * A popup that displays a message in a window corner.
 *
 * Always-on-top, yet unobtrusive.
 *
 * May be shown and hidden.
 */
function CornerPopup(id) {

  var containerId = 'b83edd14-d692-4775-a488-9bb3d146dc6d';
  this.$container = $('#' + containerId);

  if (!this.$container.length) {
    this.$container = $('<div>', { id: containerId }).css({
      'position': 'fixed',
      'z-index': 0x7fffffff, // In most browsers: max z-index === max 32-bit signed integer
      'top': 0,
      'right': 0,
      'width': 'auto',
      'height': 'auto',
      'margin': 0,
      'padding': 0,
      'border': 'none',
      'outline': 'none',
      'box-shadow': 'none',
      'background-color': 'inherit',
      'font-size': '14px',
      'line-height': 1,
      'text-decoration': 'none',
      'vertical-align': 'baseline',
      'user-select': 'none',
      'pointer-events': 'none',
      'border-radius': 0
    });

    this.$container.appendTo(document.body);
  }

  this.$popup = $('<div>', { id: id }).css({
    'text-align': 'right',
    'width': 'auto',
    'height': 'auto',
    'margin': 0,
    'padding': '6px',
    'border': 'none',
    'outline': 'none',
    'box-shadow': 'none',
    'color': '#333',
    'background-color': 'rgba(255, 255, 255, 0.8)',
    'font-family': 'Menlo, Consolas, "Liberation Mono", monospace',
    'font-size': 'inherit',
    'line-height': 'inherit',
    'text-decoration': 'inherit',
    'vertical-align': 'inherit',
    'user-select': 'inherit',
    'pointer-events': 'inherit',
    'border-radius': 0
  });

  this.namespace = containerId + '-' + id;
  this.isShowing = false;
}

/*
 * Ensure the popup is located at top of window.
 *
 * Fixed CSS positioning does not always hold, so force the correct absolute
 * position if necessary.
 */
CornerPopup.prototype.setToWindowTop = function () {
  var popupTop = this.$container.offset().top;
  var scrollTop = window.scrollY;
  if (popupTop !== scrollTop && scrollTop >= 0) {
    this.$container.css({
      'position': 'absolute',
      'top': scrollTop
    });
  }
};

/*
 * Display message in popup.
 *
 * If message is falsy, popup will be hidden.
 *
 * Parameters:
 * - message (string): The message to be displayed (required)
 */
CornerPopup.prototype.show = function (message) {
  if (!message) {
    this.hide();
  }

  this.$popup.html(message);

  if (!this.isShowing) {
    this.isShowing = true;

    this.$container.append(this.$popup);
    this.setToWindowTop();

    // Ensure that popup stays where it should be when scrolling
    var self = this;
    $(window).on('scroll.' + this.namespace, function () {
      self.setToWindowTop();
    });
  }
};

/*
 * Hide popup
 */
CornerPopup.prototype.hide = function () {
  // When hidden, don't listen to scroll events to limit performance impact
  $(window).off('scroll.' + this.namespace);
  this.$popup.remove();
  this.isShowing = false;
};


/*
 * An object for observing and comparing current text selections.
 *
 * When instantiated, captures the current selection and computes a count
 * of words and characters selected.
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
var popup = new CornerPopup();
var selectionListener = new SelectionListener(target);

// Listen for selection changes and show/hide the popup based on the number of
// words selected
$(target).on(SELECTION_CHANGE_EVENT, function (event) {
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

// On escape key down, disable the extension
$(document).on('keydown', function (event) {
  if (event.which === ESCAPE_KEY) {
    chrome.runtime.sendMessage({ active: false });
  }
});
