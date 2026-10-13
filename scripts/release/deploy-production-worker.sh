#!/usr/bin/env bash
# Invoke from apps/web after preparing the reviewed OpenNext patched bundle.
set -euo pipefail

if [[ ! "${NEXT_PUBLIC_BUILD_SHA:-}" =~ ^[0-9a-f]{40}$ ]] || [[ -z "${NEXT_PUBLIC_BUILD_TIME:-}" ]]; then
  echo "Production deploy requires the checked-out source SHA and build time." >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
secret_file="$(mktemp "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/aistroyka-provider-secrets.XXXXXX")"
chmod 600 "$secret_file"
trap 'rm -f "$secret_file"' EXIT

# Pass values only through a private file; JSON preserves quotes and newlines.
node "$script_dir/write-provider-secret-file.cjs" "$secret_file"

# Deployment-only CLI pin: workspace Wrangler 4.69 lacks --secrets-file.
# This uploads secrets with the reviewed code, preserving omitted bindings.
npx --yes wrangler@4.149.0 deploy --env production --no-bundle \
  --config wrangler.deploy.toml --secrets-file "$secret_file" \
  --var "NEXT_PUBLIC_BUILD_SHA:$NEXT_PUBLIC_BUILD_SHA" \
  --var "NEXT_PUBLIC_BUILD_TIME:$NEXT_PUBLIC_BUILD_TIME" \
  --var NEXT_PUBLIC_APP_ENV:production
