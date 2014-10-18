
/* global _:false */
/* jshint bitwise:false */

(function(root, undefined) {

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

  root.textCount = textCount;

})(this);
