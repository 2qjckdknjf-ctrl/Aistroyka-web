#!/usr/bin/env bash
# Проверка редиректов после деплоя (domain canonicalization только на Vercel).
# Запуск: ./docs/redirect-verify-after-deploy.sh

set -e

echo "=== Single request (status + location) ==="
echo "--- www.aistroyka.ai ---"
curl -sI "https://www.aistroyka.ai" | head -5
echo ""
echo "--- aistroyka.ai (apex) ---"
curl -sI "https://aistroyka.ai" | head -5
echo ""
echo "--- Vercel preview ---"
curl -sI "https://aistroyka-web-web-v7jq.vercel.app" | head -5

echo ""
echo "=== Follow redirects (-L) ==="
echo "--- www.aistroyka.ai (final URL) ---"
curl -sIL -o /dev/null -w "%{url_effective}\n" "https://www.aistroyka.ai"
echo "--- aistroyka.ai (final URL) ---"
curl -sIL -o /dev/null -w "%{url_effective}\n" "https://aistroyka.ai"
