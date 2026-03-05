# Отчёт: статус деплоя Aistroyka.ai (инвентаризация)

**Дата:** 2026-03-05  
**Цель:** Зафиксировать текущее состояние платформ, CI и конфигов перед нормализацией.

---

## 1. Платформа деплоя

| Платформа | Используется | Источник |
|-----------|--------------|----------|
| **Cloudflare Pages / Workers (OpenNext)** | Да | GitHub Actions: `.github/workflows/deploy-cloudflare-prod.yml`, `deploy-cloudflare-staging.yml`; `apps/web/.github/workflows/deploy.yml`, `ci.yml` |
| **Vercel** | Не обнаружено в репо | Нет `vercel.json`; в коде есть упоминания NEXT_PUBLIC_VERCEL_ENV (опционально) |

Итог: деплой идёт через **Cloudflare Workers** (OpenNext), не Vercel. Сборка — в GitHub Actions.

---

## 2. Текущие build/install команды в CI

| Workflow | Install | Build | Working directory |
|----------|---------|--------|--------------------|
| **apps/web/.github/workflows/ci.yml** | `npm ci --legacy-peer-deps` | `npm run cf:build` | `apps/web` |
| **.github/workflows/deploy-cloudflare-prod.yml** | `npm ci --legacy-peer-deps` | `npm run cf:build` | `apps/web` (default) |
| **.github/workflows/deploy-cloudflare-staging.yml** | `npm ci --legacy-peer-deps` | `npm run cf:build` | `apps/web` (default) |
| **apps/web/.github/workflows/deploy.yml** | `npm ci --legacy-peer-deps` | `npm run cf:build` | нет (корень репо) |

Проблемы:
- Двойная установка: используется и **Node/npm** (setup-node, npm ci), и **Bun** (setup-bun) в prod/staging, но установка — только npm.
- Нет единого менеджера: в корне настроены **workspaces** и **bun** в package.json, но CI ставит зависимости через **npm** в `apps/web`.
- Lockfile: в prod/staging кэш npm по `apps/web/package-lock.json`; в корне есть `bun.lock` (workspace lock).

---

## 3. Root package.json

- **packageManager:** `bun@1.1.38`
- **workspaces:** заданы: `apps/web`, `packages/contracts`, `packages/contracts-openapi`, `packages/api-client`
- **scripts.build:** `cd apps/web && bun run build` (next build)
- **scripts.cf:build:** `cd apps/web && bun run cf:build` (OpenNext)

Установка из корня через `bun install` ставит все workspace-пакеты и резолвит `zod` для `packages/contracts`.

---

## 4. packages/contracts/package.json

- **zod:** в `dependencies`: `"zod": "^3.23.8"` — корректно.

---

## 5. Резюме

- Деплой: **Cloudflare Workers (OpenNext)** через GitHub Actions.
- CI не согласован с монорепо: установка в `apps/web` через npm, при этом в корне — bun + workspaces.
- Нужно: один раз ставить зависимости из корня через `bun install --frozen-lockfile`, сборка — `bun run cf:build` из корня; убрать npm install из CI.
