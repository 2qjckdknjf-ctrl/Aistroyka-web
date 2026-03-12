# Деплой Aistroyka на Vercel

Краткое руководство по подключению репозитория к Vercel и первому production-деплою.

---

## 1. Подключить GitHub

1. Зайти на [vercel.com](https://vercel.com) и войти (или завести аккаунт).
2. **Add New** → **Project**.
3. Импортировать репозиторий: выбрать **GitHub** и авторизовать доступ при необходимости.
4. Выбрать репозиторий `2qjckdknjf-ctrl/Aistroyka-web` (или ваш fork).
5. Ветку для деплоя оставить ту, с которой планируете деплоить (например `main` или `ops/external-setup-attempt`).

---

## 2. Root Directory и команды сборки

Проект — монорепо: Next.js-приложение в **`apps/web`**, зависимости на пакет **`@aistroyka/contracts`** в `packages/contracts`. Пакет contracts должен быть собран до `next build` (см. [REPORT-VERCEL-CONTRACTS-FIX.md](./REPORT-VERCEL-CONTRACTS-FIX.md)).

- **Root Directory:** указать **`apps/web`**.
- **Install** и **Build** заданы в `apps/web/vercel.json` (из корня репо собирается contracts, затем web):
  - `installCommand`: `cd ../.. && npm install && npm run build:contracts:npm`
  - `buildCommand`: `cd ../.. && npm run build:contracts:npm && npm run build:web:npm`
- В Vercel часто задают `NODE_ENV=production`; при этом `npm install` по умолчанию не ставит devDependencies. Сборка contracts требует TypeScript (в devDependencies), поэтому в скрипте `build:contracts:npm` для установки в `packages/contracts` используется `npm install --prefix packages/contracts --include=dev`.

В интерфейсе Vercel лучше оставить **Override** для Install/Build пустым, чтобы использовались команды из `vercel.json`. Если задаёте вручную:

- **Install Command:** `cd ../.. && npm install && npm run build:contracts:npm`
- **Build Command:** `cd ../.. && npm run build:contracts:npm && npm run build:web:npm`
- **Output Directory:** оставить пустым (Next.js определяется автоматически).
- **Framework Preset:** Next.js (обычно определяется по проекту).

---

## 3. Environment Variables

Перед первым деплоем задать переменные окружения в **Settings → Environment Variables** (см. [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md)).

Минимальный набор для запуска:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` — итоговый URL сайта (например `https://aistroyka.ai` или preview-URL Vercel).
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_ENV` = `production`

Для production также рекомендуется:

- `REQUIRE_CRON_SECRET` = `true`
- `CRON_SECRET` = (секретная строка)
- `OPENAI_API_KEY` (если нужны AI-функции)

Секреты помечать как **Sensitive**. После изменений переменных сделать **Redeploy**.

---

## 4. Как сделать deploy

- **Автодеплой:** при push в выбранную ветку Vercel сам запускает сборку и деплой.
- **Вручную:** в проекте Vercel → вкладка **Deployments** → **Redeploy** у нужного деплоя или **Deploy** из последнего коммита.

Первый деплой после добавления переменных может занять несколько минут (install + build contracts + build Next.js).

---

## 5. Подключить домен

1. В проекте Vercel: **Settings** → **Domains**.
2. Добавить домен (например `aistroyka.ai` или `www.aistroyka.ai`).
3. Следовать подсказкам Vercel: добавить A-запись и/или CNAME у регистратора DNS в соответствии с выданными Vercel значениями.
4. После распространения DNS Vercel выдаст сертификат (Let's Encrypt) и домен будет обслуживаться по HTTPS.

**Важно:** в production задать `NEXT_PUBLIC_APP_URL` равным выбранному домену (например `https://aistroyka.ai`), без trailing slash. От этого зависят редиректы, sitemap, robots и callback URL в Supabase.

---

## Полезные ссылки

- [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md) — полный список переменных.
- [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md) — проверки перед и после публикации.
