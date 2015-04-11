/* global BrowserExtensionToggleButton:false */

var extension = new BrowserExtensionToggleButton({
  icon: {
    19: 'icons/active-19.png',
    38: 'icons/active-38.png',
  },
  title: 'Hide number of words selected'
});
extension.listen();
