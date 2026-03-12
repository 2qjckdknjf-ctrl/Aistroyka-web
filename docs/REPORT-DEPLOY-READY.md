# Deploy Ready Report — Aistroyka (Vercel)

**Дата:** 2026-03-12 (build re-verified)  
**Цель:** Подготовка к интернет-деплою через Vercel без изменений архитектуры и auth/middleware.

---

## 1. Deploy architecture

- **Тип:** монорепо (npm workspaces). Next.js-приложение — в **`apps/web`**.
- **Root для Vercel:** в настройках проекта задать **Root Directory = `apps/web`**. Сборка и установка зависимостей выполняются из корня репозитория за счёт `apps/web/vercel.json`:
  - `installCommand`: `cd ../.. && npm install`
  - `buildCommand`: `cd ../.. && npm run build`
- **Цепочка сборки:**
  1. `npm install` (в корне) — ставит зависимости корня и workspace (`apps/web`, `packages/contracts`, и др.).
  2. `npm run build` → `build:contracts` (сборка `packages/contracts`) и `build:web` (Next.js в `apps/web`).
- **Framework:** Next.js 15 (App Router), next-intl, Supabase SSR. Middleware: локали, защита маршрутов, Supabase session, security headers. API routes в `apps/web/app/api/`.
- **Output:** Next.js по умолчанию выдаёт `.next` в `apps/web`; при необходимости используется `output: "standalone"` (для self-host; Vercel использует свой runtime).

---

## 2. Environment variables

Полный перечень и описание — в [docs/ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md).

**Минимум для запуска:**

| Variable | Назначение |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный anon-ключ |
| `NEXT_PUBLIC_APP_URL` | Канонический URL сайта (например `https://aistroyka.ai`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role для серверных операций |
| `NODE_ENV` | `production` |

**Рекомендуется для production:** `REQUIRE_CRON_SECRET`, `CRON_SECRET`, `OPENAI_API_KEY` (если нужны AI-функции). В production не задавать: `DEBUG_AUTH`, `DEBUG_DIAG`, `ENABLE_DIAG_ROUTES`.

---

## 3. Build status

- **Локальная сборка:** выполнена из корня репозитория:
  - `npm install` — успешно.
  - `npm run build` — успешно (build:contracts + next build в apps/web).
- **Результат:** 272 статических страницы, API routes и middleware собираются без ошибок. Next.js 15.5.12, окружение подхватывает `.env.local` при локальной сборке; на Vercel используются переменные из Dashboard.

---

## 4. Deploy path

- **Репозиторий:** GitHub (ветка для деплоя — например `main` или `ops/external-setup-attempt`).
- **Root Directory в Vercel:** `apps/web`.
- **Команды:** берутся из `apps/web/vercel.json` (install/build из корня репо). Output directory не переопределён — Vercel определяет Next.js автоматически.
- **Документация:** [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) (подключение GitHub, root, env, деплой, домен).

---

## 5. Возможные риски

| Риск | Митигация |
|------|-----------|
| **Root Directory не `apps/web`** | Сборка не найдёт Next.js или workspace-зависимости. В настройках проекта явно указать Root Directory = `apps/web` и не переопределять Install/Build без необходимости. |
| **Нет или неверный NEXT_PUBLIC_APP_URL** | Редиректы, sitemap, robots, Supabase callbacks будут указывать на неправильный домен. Задать в Vercel переменную равной итоговому production URL. |
| **Supabase Redirect URLs** | После смены домена добавить новый URL в Supabase → Authentication → URL Configuration (Site URL и Redirect URLs). |
| **Отсутствие favicon.ico** | В layout указан `/favicon.ico`; файла в `apps/web/public/` может не быть. Рекомендуется добавить `favicon.ico` в `public`; иначе используется только SVG из metadata. |
| **Cron / job-эндпоинты** | В production задать `REQUIRE_CRON_SECRET=true` и `CRON_SECRET`, иначе вызовы могут быть доступны без проверки. |
| **Standalone output** | В `next.config.js` задано `output: "standalone"` (для Cloudflare/self-host). Vercel это игнорирует и использует свой вывод; на деплой не влияет. |

Архитектура, middleware и auth flows не менялись; правки ограничены deploy readiness (документация, vercel.json, чеклисты).

---

## Итог

- Проект готов к деплою на Vercel при условии задания env и настройки Root Directory.
- Сборка локально проходит успешно.
- Документация: [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md), [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md), [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md).
