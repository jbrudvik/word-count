# Word Count

A browser extension for viewing the number of words in text selections. When activated, the count appears in the top-right corner of the browser window.

- Select text (with mouse or keyboard) to see the number of words.
- Quickly view the number of words on an entire page using keyboard shortcut (OS X: CMD-a, Windows: CTRL-a).
- Click the extension button to activate/deactivate. The ESC key can also be used to deactivate.

Words are counted by splitting selected text on whitespace and considering resulting groups of characters to be words if they contain at least one "alphanumeric" character.

<img src="https://raw.githubusercontent.com/jbrudvik/word-count/master/screenshots/chrome/line-selected-1280x800.jpg" alt="Word Count Chrome screenshot" width="640"/>

## Install

### Chrome

Install from the Chrome Web Store: [https://chrome.google.com/webstore/detail/word-count/iemgpaejfjknfhcahkeijkmickjhnhik](https://chrome.google.com/webstore/detail/word-count/iemgpaejfjknfhcahkeijkmickjhnhik)

Note: Tabs must be reloaded after installing.

### Safari

[https://github.com/jbrudvik/word-count/releases/download/v1.2.0/word-count.safariextz](https://github.com/jbrudvik/word-count/releases/download/v1.2.0/word-count.safariextz)

Note: Tabs must be reloaded after installing.


## Develop

### Chrome

The `chrome-extension` directory contains all files needed by the extension, except the dependencies:

    $ cd chrome-extension
    $ bower install

After installing the dependencies, [load the unpacked extension](https://developer.chrome.com/extensions/getstarted#unpacked) from the `chrome-extension` directory.

### Safari

The `word-count.safariextension` directory contains all files needed by the extension, except the dependencies:

    $ cd word-count.safariextension
    $ bower install

After installing the dependencies, [add and install the extension using the Safari Extension Builder](https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/UsingExtensionBuilder/UsingExtensionBuilder.html#//apple_ref/doc/uid/TP40009977-CH2-SW5) from the `word-count.safariextension` directory.

## See also

- [Character Count](https://github.com/jbrudvik/character-count)
