#!/usr/bin/env bash
# Minimal STAGE 4 pilot driver: Maestro flows + env from .env.local (no secrets printed).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# JDK 17+ required by Maestro 2.x (set MAESTRO_JAVA_HOME or JAVA_HOME, or install brew openjdk@17).
if [[ -n "${MAESTRO_JAVA_HOME:-}" ]]; then
  export JAVA_HOME="$MAESTRO_JAVA_HOME"
elif [[ -z "${JAVA_HOME:-}" ]]; then
  for j in /usr/local/opt/openjdk@17 /opt/homebrew/opt/openjdk@17; do
    if [[ -d "$j/libexec/openjdk.jdk/Contents/Home" ]]; then
      export JAVA_HOME="$j/libexec/openjdk.jdk/Contents/Home"
      break
    fi
  done
fi

export PATH="${PATH}:${HOME}/.maestro/bin"

if [[ -f "${ROOT}/.env.local" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ROOT}/.env.local"
  set +a
fi

: "${SMOKE_EMAIL:?Set SMOKE_EMAIL in .env.local or environment}"
: "${SMOKE_PASSWORD:?Set SMOKE_PASSWORD in .env.local or environment}"

export MAESTRO_ANDROID_DEVICE_ID="${MAESTRO_ANDROID_DEVICE_ID:-}"

RUN_TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
OUT="${ROOT}/maestro/output"
mkdir -p "${OUT}"
echo "Maestro pilot run started: ${RUN_TS}" | tee "${OUT}/last_run.txt"

E=( -e "SMOKE_EMAIL=${SMOKE_EMAIL}" -e "SMOKE_PASSWORD=${SMOKE_PASSWORD}" )

if command -v maestro >/dev/null 2>&1; then
  maestro test "${ROOT}/maestro/flows/android_worker_pilot.yaml" "${E[@]}" 2>&1 | tee "${OUT}/android_worker.log" || true
  maestro test "${ROOT}/maestro/flows/android_manager_pilot.yaml" "${E[@]}" 2>&1 | tee "${OUT}/android_manager.log" || true
  if command -v xcrun >/dev/null 2>&1; then
    maestro test "${ROOT}/maestro/flows/ios_worker_pilot.yaml" "${E[@]}" 2>&1 | tee "${OUT}/ios_worker.log" || true
    maestro test "${ROOT}/maestro/flows/ios_manager_pilot.yaml" "${E[@]}" 2>&1 | tee "${OUT}/ios_manager.log" || true
  fi
else
  echo "ERROR: maestro not on PATH (install CLI and add ~/.maestro/bin)." | tee -a "${OUT}/last_run.txt"
  exit 1
fi

echo "Logs: ${OUT}/" | tee -a "${OUT}/last_run.txt"
exit 0
