# Tab Group from CLI

Open any number of links in a named Chrome tab group with one terminal command.

Chrome can open links from the command line, but it can't group them. This repo has a small Chrome extension that does the grouping, plus a command-line helper for macOS, Linux and Windows.

```bash
tabgroup "Sprint review" https://tracker.example.com https://code.example.com https://docs.example.com
tabgroup -c blue -C "Reading" https://a.example.com https://b.example.com
```

## Install

1. Install the extension from the Chrome Web Store, or load it yourself: open `chrome://extensions`, turn on Developer mode, click "Load unpacked" and pick `tabgroup-extension/extension`.
2. Put the helper on your PATH.

   macOS / Linux:
   ```bash
   chmod +x tabgroup-extension/tabgroup
   ln -s "$PWD/tabgroup-extension/tabgroup" /usr/local/bin/tabgroup
   ```

   Windows (PowerShell):
   ```powershell
   .\tabgroup-extension\tabgroup.ps1 -Name "Reading" -Color blue https://a.example.com https://b.example.com
   ```

## Options

| Option | PowerShell | Meaning |
| --- | --- | --- |
| `-c color` | `-Color color` | grey, blue, red, yellow, green, pink, purple, cyan or orange |
| `-C` | `-Collapsed` | Start the group collapsed |

Set `CHROME=/path/to/chrome` to use a different Chrome binary.

## How it works

The helper opens one address in Chrome:

```
http://tabgroup.localhost/?name=<group>&color=<color>&collapsed=1&u=<url1>&u=<url2>...
```

The extension watches only `tabgroup.localhost`. When it sees that address, it opens each `u` link in order, groups the tabs, sets the name and color, and closes the helper tab. It works whether Chrome is already open or not.

You can also open that address from any tool that can launch a URL, such as scripts, Shortcuts or bookmarks.

## Privacy

The extension collects no data and can't see your other tabs. See [PRIVACY.md](PRIVACY.md).

## Build the store package

```bash
./build.sh
```

This writes `dist/upload-tabgroup-<version>.zip` for the Chrome Web Store. Store listing text and graphics are in `chrome-web-store/`.
