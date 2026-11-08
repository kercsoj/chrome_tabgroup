# Privacy policy: Tab Group from CLI

Tab Group from CLI doesn't collect, store or share any personal or browsing data.

The extension reads only `http://tabgroup.localhost/` addresses that you open yourself, for example with the `tabgroup` command. It uses the group name and links in that address to open and group tabs, then closes the address. It can't read any other tab or site, and it makes no network requests of its own.

To return you to the page you were on after opening a collapsed group, the extension keeps the internal IDs of the last few active tabs in Chrome's session storage. These are numbers only, not URLs or page content. They stay on your computer and are cleared when Chrome closes.

Questions: open an issue at https://github.com/kercsoj/chrome_tabgroup/issues
