
/* global $:false, _:false */

(function (window, undefined) {

  /*
   * A popup that displays a message in a window corner.
   *
   * Always-on-top, yet unobtrusive.
   *
   * May be shown and hidden.
   *
   * Parameters:
   * - id (string): The id of the corner popup. Used for determining order. (required)
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
   * Inserts an element underneath a container element in position maintains
   * sorted order of child elements by given attr.
   *
   * Assumptions:
   * - Existing children of container are sorted by attr
   *
   * Parameters:
   * - element: The element to be inserted (required)
   * - container: The element under which element will be inserted (required)
   * - attr (string): The attribute by which child elements are sorted (default: id)
   */
  CornerPopup.prototype.insertSortedByAttr = function (element, container, attr) {
    attr = attr || 'id';
    var $element = $(element);
    var $container = $(container);
    var $children = $($container.children());
    var childIds = $children.map(function (index, child) {
      return(child.id);
    });
    var index = _.sortedIndex(childIds, $element.attr(attr));
    if (!index) {
      $element.prependTo($container);
    } else {
      $element.insertAfter($($children[index - 1]));
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

      this.insertSortedByAttr(this.$popup, this.$container);

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

  window.CornerPopup = CornerPopup;

})(this);
