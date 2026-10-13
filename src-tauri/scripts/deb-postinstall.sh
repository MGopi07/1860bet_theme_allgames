#!/bin/sh
set -e
# Clear old webview cache across user profiles so newly installed app loads current files cleanly
for u in /home/*; do
  if [ -d "$u/.cache/com.betwise.smartpc" ]; then
    rm -rf "$u/.cache/com.betwise.smartpc" 2>/dev/null || true
  fi
  if [ -d "$u/.cache/com.winbet.smartpc" ]; then
    rm -rf "$u/.cache/com.winbet.smartpc" 2>/dev/null || true
  fi
done
exit 0
