
/* global textCount:false */

(function (window, undefined) {

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

  window.EquatableSelection = EquatableSelection;

})(this);
