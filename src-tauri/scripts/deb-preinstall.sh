#!/bin/sh
set -e
# Force terminate any previous running instance of winbet-smart-pc or betwise-smartpc
killall -9 betwise-smartpc 2>/dev/null || true
killall -9 winbet-smart-pc 2>/dev/null || true
exit 0
