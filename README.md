# Word Count

A browser extension for viewing the number of words in text selections. When activated, the count appears in the top-right corner of the browser window.

- Select text (with mouse or keyboard) to see the number of words.
- Quickly view the number of words on an entire page using keyboard shortcut (OS X: CMD-a, Windows: CTRL-a).
- Click the extension button to activate/deactivate. The ESC key can also be used to deactivate.

Words are counted by splitting selected text on whitespace and considering resulting groups of characters to be words if they contain at least one "alphanumeric" character.


## Install

### Chrome

Not yet released. Follow development instructions for now.

### Safari

Not yet released. Follow development instructions for now.


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
