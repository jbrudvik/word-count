
/* global $:false, _:false, EquatableSelection:false */

(function (window, undefined) {

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

  SelectionListener.SELECTION_CHANGE_EVENT = 'selectionChange';

  /*
   * Handle events and check for selection changes.
   *
   * Trigger selectionChange event if a selection change has occurred.
   *
   * selectionChange event includes EquatableSelection `selection` property.
   */
  SelectionListener.prototype.handleEvent = function (event) {
    var current = new EquatableSelection();

    if (current) {
      if (!current.isEqual(this.previous)) {
        // Trigger a selectionChange event if this selection is not equal to
        // the previously-observed selection
        $(this.target).trigger({
          type: SelectionListener.SELECTION_CHANGE_EVENT,
          selection: current
        });
        this.previous = current;
      }
    } else if (this.previous) {
      // Trigger empty event to signify that a selection has been "unselected"
      $(this.target).trigger(SelectionListener.SELECTION_CHANGE_EVENT);
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
      $(this.target).trigger(SelectionListener.SELECTION_CHANGE_EVENT);
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

  window.SelectionListener = SelectionListener;

})(this);
