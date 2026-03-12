# Отчёт: разделение путей деплоя Vercel и Cloudflare (OpenNext)

**Цель:** Устранить падение Vercel build из-за подключения Cloudflare/OpenNext-адаптера и зависимости от `wrangler`, сохранив возможность будущего деплоя на Cloudflare.

---

## 1. Root cause

**Ошибка на Vercel:**
```text
Cannot find package 'wrangler' imported from
node_modules/@opennextjs/cloudflare/dist/api/cloudflare-context.js
```

**Причина:**
- В проекте есть интеграция **@opennextjs/cloudflare** (OpenNext для Cloudflare Workers).
- В **`apps/web/next.config.js`** безусловно выполнялись:
  - `require("@opennextjs/cloudflare")`
  - `initOpenNextCloudflareForDev()`
- При загрузке конфига Next.js подтягивал пакет `@opennextjs/cloudflare`, внутри которого `cloudflare-context.js` импортирует **`wrangler`**.
- На Vercel пакет `wrangler` не нужен и может отсутствовать или не резолвиться в контексте сборки → сборка падала.
- Итог: **один и тот же конфиг** использовался и для Vercel, и для Cloudflare; адаптер Cloudflare подключался всегда и ломал Vercel build.

**Где именно подключался адаптер:**
- **`apps/web/next.config.js`** — блок `try { require("@opennextjs/cloudflare"); initOpenNextCloudflareForDev(); } catch { ... }` выполнялся при каждой загрузке конфига (в т.ч. при `next build` на Vercel).
- Корневой **`next.config.js`** содержал такой же блок (для согласованности он тоже обновлён).

---

## 2. Реализованное разделение deploy targets

**Принцип:** На Vercel сборка должна идти как **обычный Next.js** (без OpenNext и без wrangler). Путь Cloudflare/OpenNext остаётся доступным для деплоя на Workers (отдельные скрипты `cf:build` / `cf:deploy`).

**Механизм переключения:**
- Определяется режим **Vercel deploy**: `process.env.VERCEL === "1"` или `process.env.DEPLOY_TARGET === "vercel"`.
- **Если это Vercel** — блок с `require("@opennextjs/cloudflare")` и `initOpenNextCloudflareForDev()` **не выполняется**. Конфиг Next.js остаётся тем же (next-intl, security headers, webpack, output и т.д.), но адаптер OpenNext не загружается → в граф зависимостей не попадают `@opennextjs/cloudflare` и `wrangler`.
- **Если это не Vercel** (локальная разработка или будущий Cloudflare build) — поведение как раньше: попытка подключить OpenNext для dev/Cloudflare; при отсутствии пакета — тихий catch.

**Изменённые файлы:**

| Файл | Изменение |
|------|-----------|
| `apps/web/next.config.js` | Перед блоком с OpenNext добавлена проверка `isVercelDeploy`; `require` и `initOpenNextCloudflareForDev()` вызываются только при `!isVercelDeploy`. |
| `next.config.js` (root) | Аналогичная проверка и условный вызов OpenNext для согласованности. |

**Переменные окружения:**
- **Vercel:** платформа сама выставляет **`VERCEL=1`** при сборке. Дополнительно ничего задавать не нужно.
- **Локальная проверка Vercel-пути:** можно вызвать `VERCEL=1 npm run build:web:npm`.
- **Явное указание цели:** при необходимости можно задать **`DEPLOY_TARGET=vercel`** (тогда Vercel-режим включится и без `VERCEL=1`).

---

## 3. Что нужно для Vercel

- **Root Directory:** `apps/web`.
- **Install/Build:** из `apps/web/vercel.json` (из корня репо: install, build:contracts:npm, build:web:npm). В Vercel UI переопределять не обязательно.
- **Env:** как в [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) и [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md). Отдельная переменная для «режима Vercel» не нужна — достаточно стандартного `VERCEL=1` при сборке.

---

## 4. Сохранение пути Cloudflare на будущее

- **Не удалялось:** зависимости `@opennextjs/cloudflare` и `wrangler` в root и в `apps/web`, скрипты `cf:build`, `cf:deploy`, `open-next.config.ts`, патчи под OpenNext (например `patch-worker-bypass-api-middleware.cjs`, `patch-bundle-require.cjs` и т.д.).
- **Логика:** при сборке **не на Vercel** (нет `VERCEL=1` и нет `DEPLOY_TARGET=vercel`) конфиг по-прежнему подключает OpenNext для dev/Cloudflare.
- **Деплой на Cloudflare:** как и раньше — отдельная цепочка: `npm run cf:build` (next build + opennextjs-cloudflare build + патчи), затем `npm run cf:deploy` (wrangler). Она не используется на Vercel и не мешает Vercel build.
- Если Cloudflare-путь частично сломан или не доделан — это не блокирует Vercel; при необходимости его можно довести отдельно.

---

## 5. Результаты локальной проверки

- **Contracts:** `npm run build:contracts:npm` — успешно.
- **Vercel-подобный build:** `VERCEL=1 npm run build:web:npm` — успешно (prebuild contracts, затем `next build` без подключения OpenNext; ошибки «Cannot find package 'wrangler'» нет).
- **Итог:** сборка, соответствующая среде Vercel, проходит локально; при деплое на Vercel платформа выставит `VERCEL=1`, и сборка должна завершиться так же.

---

## 6. Что проверить после первого успешного Vercel deploy

После того как сборка на Vercel впервые пройдёт и приложение будет задеплоено, рекомендуется быстрый smoke-чек:

| Проверка | Действие |
|----------|----------|
| **Homepage** | Открыть корень (например `https://<project>.vercel.app` или production URL), убедиться, что главная отдаётся (редирект на локаль допустим). |
| **Публичные страницы** | Проверить несколько маршрутов (about, pricing, contact и т.д.) в нужной локали. |
| **Login** | Перейти на страницу входа, форма отображается, нет 5xx. |
| **Register** | Аналогично страница регистрации. |
| **Dashboard** | После входа — доступ в кабинет (редиректы, данные, без 5xx). |
| **API health** | Вызвать `/api/health` (и при необходимости `/api/health/auth`) — ожидаемый ответ. |
| **Middleware / редиректы** | Локализация (префикс locale), редиректы с корня на выбранную локаль. |
| **Favicon / assets** | Favicon, логотип и ключевые статичные ресурсы отдаются. |
| **Environment variables** | В Vercel Dashboard проверено: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_SERVICE_ROLE_KEY` и при необходимости остальные по [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md). |
| **Supabase** | В Supabase в Authentication → URL Configuration добавлены Site URL и Redirect URLs для деплой-URL (preview и production). |

При проблемах — смотреть логи сборки и рантайма в Vercel и при необходимости [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md).

---

## Итог

- **Причина падения:** безусловное подключение `@opennextjs/cloudflare` в `next.config.js` и зависимость от `wrangler` в графе сборки на Vercel.
- **Исправление:** по флагу `VERCEL=1` (или `DEPLOY_TARGET=vercel`) адаптер OpenNext в конфиге не загружается — Vercel собирает приложение как обычный Next.js.
- **Cloudflare:** путь сохранён (cf:build, wrangler, open-next.config.ts и связанные скрипты), используется только при деплое на Cloudflare и не влияет на Vercel.
