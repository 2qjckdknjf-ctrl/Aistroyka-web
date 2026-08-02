#!/usr/bin/env bash
# Capture Block-1 design evidence using DesignPreview (deterministic, no auth bypass).
# Usage: bash scripts/mobile/capture-design-preview-evidence.sh
#
# Requirements:
# - Prebuilt Debug apps in DerivedData under .evidence/design-unification-block1-pass2/
# - Isolated iPhone 17 Pro UDID (default below); reboot between Manager/Worker to clear SpringBoard alerts
# - Android emulator preferred on emulator-5562; falls back to emulator-5554 (font_scale restored)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EV="$ROOT/.evidence/design-unification-block1-pass2"
SIM_UDID="${SIM_UDID:-779B2896-9F65-4CD6-93FB-B791DAAE02A8}"
DD_MGR="$EV/deriveddata-manager"
DD_WKR="$EV/deriveddata-worker"
MGR_APP="$DD_MGR/Build/Products/Debug-iphonesimulator/AiStroykaManager.app"
WKR_APP="$DD_WKR/Build/Products/Debug-iphonesimulator/AiStroykaWorker.app"
SCREENS=(login first_run home projects tasks reports settings empty error loading offline media)
ANDROID_SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="/usr/bin:${JAVA_HOME:-$HOME/Library/Java/JavaVirtualMachines/jbr-17.0.14/Contents/Home}/bin:$ANDROID_SDK/platform-tools:$PATH"

mkdir -p "$EV"/{ios-manager,ios-worker,android-manager,android-worker,logs}

validate_png() {
  local f="$1" expect_id="$2"
  /usr/bin/python3 - "$f" "$expect_id" <<'PY'
import sys
from PIL import Image
path, expect = sys.argv[1], sys.argv[2]
im = Image.open(path).convert("RGB")
w, h = im.size
assert w > 100 and h > 100, f"too small {path}"
samples = [im.getpixel((10,10)), im.getpixel((w//2,h//2)), im.getpixel((w-10,h-10))]
if all(sum(s) < 25 for s in samples):
    raise SystemExit(f"BLANK/BLACK screenshot: {path}")
# Reject launcher splash (near-white center circle on navy)
cx, cy = w // 2, h // 2
center = im.getpixel((cx, cy))
uniq = len({im.getpixel((x, y)) for x in range(0, w, max(1, w // 30)) for y in range(0, h, max(1, h // 30))})
if uniq < 6 and sum(center) > 600:
    raise SystemExit(f"LIKELY_SPLASH {path} uniq={uniq} center={center}")
# Reject iOS notification permission sheet (two mid-gray buttons)
y_btn = int(h * 0.55)
left = im.getpixel((int(w * 0.32), y_btn))
right = im.getpixel((int(w * 0.68), y_btn))
if abs(sum(left) - sum(right)) < 40 and 90 < sum(left) / 3 < 160 and 90 < sum(right) / 3 < 160:
    sheet = im.getpixel((w // 2, int(h * 0.42)))
    if 50 < sum(sheet) / 3 < 140 and sum(samples[0]) < 60:
        raise SystemExit(f"ALERT_OVERLAY {path}")
if "login" in expect:
    yellows = 0
    for y in range(0, h, 10):
        for x in range(0, w, 10):
            r, g, b = im.getpixel((x, y))
            if r > 180 and g > 140 and b < 90:
                yellows += 1
    if yellows < 20:
        raise SystemExit(f"NO_YELLOW_CTA {path} yellows={yellows}")
r, g, b = samples[0]
print(f"OK {path} size={im.size} corner=({r},{g},{b}) uniq={uniq} expect={expect}")
PY
}

reboot_sim() {
  xcrun simctl shutdown "$SIM_UDID" >/dev/null 2>&1 || true
  sleep 2
  xcrun simctl boot "$SIM_UDID"
  xcrun simctl bootstatus "$SIM_UDID" -b
  sleep 3
}

capture_ios() {
  local bundle="$1" app="$2" outdir="$3" identity="$4"
  mkdir -p "$outdir"
  xcrun simctl uninstall "$SIM_UDID" ai.aistroyka.manager >/dev/null 2>&1 || true
  xcrun simctl uninstall "$SIM_UDID" ai.aistroyka.worker >/dev/null 2>&1 || true
  xcrun simctl privacy "$SIM_UDID" reset all >/dev/null 2>&1 || true
  xcrun simctl install "$SIM_UDID" "$app"
  xcrun simctl privacy "$SIM_UDID" grant notifications "$bundle" >/dev/null 2>&1 || true
  for screen in "${SCREENS[@]}"; do
    xcrun simctl terminate "$SIM_UDID" "$bundle" >/dev/null 2>&1 || true
    xcrun simctl launch "$SIM_UDID" "$bundle" -DesignPreview "$screen"
    sleep 3.5
    xcrun simctl io "$SIM_UDID" screenshot "$outdir/${screen}-normal.png"
    validate_png "$outdir/${screen}-normal.png" "$identity/$screen"
  done
  xcrun simctl terminate "$SIM_UDID" "$bundle" >/dev/null 2>&1 || true
  xcrun simctl launch "$SIM_UDID" "$bundle" -DesignPreview login -DesignPreviewA11y
  sleep 3.5
  xcrun simctl io "$SIM_UDID" screenshot "$outdir/login-a11y-xl.png"
  validate_png "$outdir/login-a11y-xl.png" "$identity/login-a11y"
  xcrun simctl terminate "$SIM_UDID" "$bundle" >/dev/null 2>&1 || true
  xcrun simctl launch "$SIM_UDID" "$bundle" -DesignPreview home -DesignPreviewA11y
  sleep 3.5
  xcrun simctl io "$SIM_UDID" screenshot "$outdir/home-a11y-xl.png"
  validate_png "$outdir/home-a11y-xl.png" "$identity/home-a11y"
  xcrun simctl terminate "$SIM_UDID" "$bundle" >/dev/null 2>&1 || true
  xcrun simctl uninstall "$SIM_UDID" "$bundle" >/dev/null 2>&1 || true
}

capture_android() {
  local serial="$1" pkg="$2" activity="$3" outdir="$4" apk="$5" mark="$6"
  mkdir -p "$outdir"
  adb -s "$serial" install -r "$apk"
  for screen in login first_run home projects tasks reports settings empty error loading offline media; do
    adb -s "$serial" shell am force-stop "$pkg"
    adb -s "$serial" shell am start -W -n "$pkg/$activity" --es design_preview "$screen"
    sleep 5
    adb -s "$serial" exec-out screencap -p > "$outdir/${screen}-normal.png"
    validate_png "$outdir/${screen}-normal.png" "$mark/$screen"
  done
  adb -s "$serial" shell settings put system font_scale 1.3
  sleep 1
  for screen in login home settings; do
    adb -s "$serial" shell am force-stop "$pkg"
    adb -s "$serial" shell am start -W -n "$pkg/$activity" --es design_preview "$screen"
    sleep 5
    adb -s "$serial" exec-out screencap -p > "$outdir/${screen}-large-font.png"
    validate_png "$outdir/${screen}-large-font.png" "$mark/$screen-large"
  done
  adb -s "$serial" shell settings put system font_scale 1.0
  adb -s "$serial" shell am force-stop "$pkg"
}

echo "Boot isolated iOS sim $SIM_UDID"
reboot_sim
open -a Simulator --args -CurrentDeviceUDID "$SIM_UDID" >/dev/null 2>&1 || true

capture_ios ai.aistroyka.manager "$MGR_APP" "$EV/ios-manager" manager
reboot_sim
capture_ios ai.aistroyka.worker "$WKR_APP" "$EV/ios-worker" worker

SERIAL=""
if adb devices | grep -q 'emulator-5562'; then
  SERIAL=emulator-5562
elif adb devices | grep -q 'emulator-5554'; then
  SERIAL=emulator-5554
fi

if [[ -n "$SERIAL" ]]; then
  adb -s "$SERIAL" shell settings put system font_scale 1.0
  capture_android "$SERIAL" ai.aistroyka.manager .MainActivity "$EV/android-manager" \
    "$ROOT/android/AiStroykaManager/build/outputs/apk/debug/AiStroykaManager-debug.apk" manager
  capture_android "$SERIAL" ai.aistroyka.worker .MainActivity "$EV/android-worker" \
    "$ROOT/android/AiStroykaWorker/build/outputs/apk/debug/AiStroykaWorker-debug.apk" worker
  adb -s "$SERIAL" shell settings put system font_scale 1.0
  echo "ANDROID_SERIAL=$SERIAL" > "$EV/logs/android-serial.txt"
else
  echo "ANDROID_SCREENSHOT_BLOCKED: no emulator" | tee "$EV/logs/android-serial.txt"
fi

echo "EVIDENCE_DIR=$EV"
