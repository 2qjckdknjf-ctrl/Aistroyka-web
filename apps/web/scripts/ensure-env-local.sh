#!/usr/bin/env bash
# Creates .env.local from .env.local.example if it does not exist.
# Run from apps/web: ./scripts/ensure-env-local.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_LOCAL="$WEB_ROOT/.env.local"
ENV_EXAMPLE="$WEB_ROOT/.env.local.example"

if [[ -f "$ENV_LOCAL" ]]; then
  echo ".env.local exists. Backend can use NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from it."
  exit 0
fi

if [[ ! -f "$ENV_EXAMPLE" ]]; then
  echo "Error: .env.local.example not found at $ENV_EXAMPLE"
  exit 1
fi

cp "$ENV_EXAMPLE" "$ENV_LOCAL"
echo "Created .env.local from .env.local.example."
echo "Edit .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase Dashboard → Project Settings → API)."
exit 0
