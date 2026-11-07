#!/usr/bin/env bash
# Builds the Chrome Web Store upload zip into dist/.
set -euo pipefail
cd "$(dirname "$0")/tabgroup-extension/extension"
version=$(python3 -c 'import json; print(json.load(open("manifest.json"))["version"])')
mkdir -p ../../dist
out="../../dist/upload-tabgroup-$version.zip"
rm -f "$out"
zip -qr "$out" manifest.json bg.js icons -x '*.DS_Store'
echo "Built dist/upload-tabgroup-$version.zip"
