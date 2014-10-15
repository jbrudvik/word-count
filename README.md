# Word Count

A Google Chrome extension for viewing the number of words in text selections. When activated, the count appears in the top-right corner of the browser window.

- Select text (with mouse or keyboard) to see the number of words.
- Quickly view the number of words on an entire page using keyboard shortcut (OS X: CMD-a, Windows: CTRL-a).
- Click the extension button to activate/deactivate. The ESC key can also be used to deactivate.

Words are counted by splitting selected text on whitespace and considering resulting groups of characters to be words if they contain at least one "alphanumeric" character.


## Development

The `src` directory contains all files needed by the extension, except the dependencies:

    $ cd src
    $ bower install

After installing the dependencies, [load the unpacked extension](https://developer.chrome.com/extensions/getstarted#unpacked) from the `src` directory.
