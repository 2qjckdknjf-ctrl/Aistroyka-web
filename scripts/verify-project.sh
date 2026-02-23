#!/usr/bin/env bash
# Проверка работоспособности проекта (структура, дубликаты, сборка)
set -e
cd "$(dirname "$0")/.."
ROOT=$(pwd)
ERR=0

echo "=== 1. Repo root ==="
echo "ROOT=$ROOT"
echo ""

echo "=== 2. Дубликаты ' 2' в имени файлов ==="
DUP=$(find . -type f -name '* 2*' ! -path './.git/*' 2>/dev/null | wc -l)
if [ "$DUP" -eq 0 ]; then
  echo "OK: дубликатов не найдено (0 файлов)"
else
  echo "FAIL: найдено $DUP файлов с ' 2' в имени:"
  find . -type f -name '* 2*' ! -path './.git/*' 2>/dev/null
  ERR=1
fi
echo ""

echo "=== 3. Обязательные файлы ==="
for f in package.json tsconfig.json next.config.js app/layout.tsx app/page.tsx lib/supabase/server.ts lib/supabase/middleware.ts middleware.ts; do
  if [ -f "$ROOT/$f" ]; then
    echo "  OK $f"
  else
    echo "  MISSING $f"
    ERR=1
  fi
done
echo ""

echo "=== 4. setAll(cookiesToSet) — только типизированные вхождения ==="
UNTYPED=$(grep -Rl 'setAll(cookiesToSet) {' --include='*.ts' . 2>/dev/null | grep -v node_modules || true)
if [ -z "$UNTYPED" ]; then
  echo "OK: нетипизированных setAll не найдено"
  grep -Rn 'setAll(cookiesToSet' --include='*.ts' . 2>/dev/null | grep -v node_modules | head -10 || true
else
  echo "FAIL: нетипизированный setAll в: $UNTYPED"
  ERR=1
fi
echo ""

echo "=== 5. Сборка (npm run build) ==="
if command -v npm >/dev/null 2>&1; then
  npm run build 2>&1 && echo "OK: сборка прошла" || { echo "FAIL: сборка упала"; ERR=1; }
elif command -v bun >/dev/null 2>&1; then
  bun run build 2>&1 && echo "OK: сборка прошла" || { echo "FAIL: сборка упала"; ERR=1; }
else
  echo "SKIP: npm и bun не найдены в PATH — установите Node.js и выполните: npm install && npm run build"
fi
echo ""

if [ $ERR -eq 0 ]; then
  echo "=== Итог: проверка пройдена ==="
  exit 0
else
  echo "=== Итог: есть ошибки ==="
  exit 1
fi
