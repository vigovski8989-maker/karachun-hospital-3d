#!/bin/bash
# Пересобрать APK после правок в www/
set -e; cd "$(dirname "$0")"; npx cap sync android; echo "sdk.dir=$HOME/android" > android/local.properties
(cd android && ./gradlew assembleDebug --no-daemon); cp android/app/build/outputs/apk/debug/app-debug.apk dist/karachun-v27-debug.apk; echo dist/karachun-v27-debug.apk
