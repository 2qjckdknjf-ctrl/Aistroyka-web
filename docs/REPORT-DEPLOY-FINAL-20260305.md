# Отчёт: деплой Aistroyka.ai — финальный статус и чеклист

**Дата:** 2026-03-05  
**Цель:** Зелёный деплой (сборка, домен, health, один менеджер зависимостей).

---

## 1. Настройки CI (установлены в репозитории)

| Параметр | Значение |
|----------|----------|
| **Install command** | `bun install --frozen-lockfile` (из **корня** репозитория) |
| **Build command** | `bun run cf:build` (из корня; внутри — `cd apps/web && bun run cf:build`) |
| **Root directory** | Корень репозитория (не apps/web) |
| **Bun version** | `1.2.15` (в workflow: `bun-version: "1.2.15"`; в package.json: `packageManager: "bun@1.2.15"`) |

Используемые workflow-файлы:

- **Production:** `.github/workflows/deploy-cloudflare-prod.yml` (push to `main`)
- **Staging:** `.github/workflows/deploy-cloudflare-staging.yml` (push to `develop`)
- **CI (PR):** `apps/web/.github/workflows/ci.yml` (lint, test, cf:build)
- **Deploy (manual):** `apps/web/.github/workflows/deploy.yml` (workflow_dispatch + push to main)

Дополнительных шагов `npm install` в CI нет.

---

## 2. DNS (рекомендации для Cloudflare)

Деплой идёт на **Cloudflare Workers** (OpenNext). Маршруты к Worker настраиваются в **Cloudflare Dashboard → Workers & Pages → aistroyka-web-production → Settings → Domains & Routes**.

Рекомендуемые записи в **Cloudflare DNS** (зона `aistroyka.ai`):

| Type | Name | Content | Proxy | Примечание |
|------|------|---------|--------|------------|
| **A** или **CNAME** | `@` (apex) | По инструкции Cloudflare для Workers (или CNAME на workers proxy) | По желанию (см. ниже) | Apex для aistroyka.ai |
| **CNAME** | `www` | Целевой хост Workers (или `@` если поддерживается) | По желанию | www.aistroyka.ai |

- **Proxy (оранжевое облако):** для Workers обычно включают (Proxied). При проблемах (522/циклы редиректов) временно переключите на **DNS only** для проверки.
- **SSL/TLS:** рекомендуется **Full (strict)** после привязки домена к Worker.
- **Canonical:** выберите один вариант (например `https://aistroyka.ai`) и настройте редирект с `www` на apex (или наоборот) в приложении или в Cloudflare (Page Rules / Redirect Rules).

Точные значения «Content» и привязка домена к Worker берутся из Cloudflare Dashboard (Workers → Custom Domains). В `wrangler.toml` маршруты закомментированы и управляются вручную в Dashboard.

---

## 3. Переменные окружения (только имена)

Для production (Cloudflare Workers / build-time и runtime) должны быть заданы:

**Обязательные для приложения:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (например `https://aistroyka.ai`)

**Серверные (не экспонировать в клиент):**

- `SUPABASE_SERVICE_ROLE_KEY` (rate limit, admin-операции)
- `OPENAI_API_KEY` (если используется AI)
- `NEXT_PUBLIC_BUILD_SHA`, `NEXT_PUBLIC_BUILD_TIME` (подставляются в CI, не задавать вручную в production)

**Опционально:**

- `AI_ANALYSIS_URL`, `OPENAI_VISION_MODEL`, `OPENAI_VISION_TIMEOUT_MS`, `OPENAI_RETRY_ON_5XX`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` (push)

Где задавать: **Cloudflare Dashboard → Workers & Pages → aistroyka-web-production → Settings → Variables and Secrets** (для production). Для сборки в GitHub Actions при необходимости добавьте соответствующие секреты в репозитории.

---

## 4. Результаты проверок (2026-03-05)

| Проверка | URL | Ожидание | Фактический результат |
|----------|-----|----------|------------------------|
| Apex | https://aistroyka.ai/ | 200 или 302 | **404** (страница не найдена; ответ от Cloudflare cdg1) |
| www | https://www.aistroyka.ai/ | 200 или 302 | **404** |
| Health | https://aistroyka.ai/api/v1/health | 200 + JSON | **404** |

Вывод: домен отвечает через Cloudflare, но запросы возвращают 404. Возможные причины: Worker не привязан к домену/маршрутам, или последний деплой не проходил/не завершился. После следующего успешного деплоя с main и корректной привязки домена к Worker повторить проверки.

Локальные проверки:

- `bun install --frozen-lockfile` — ок
- `bun run build` — ок (next build)
- `bun run cf:build` — не запускался в рамках этого отчёта; должен выполняться в CI

---

## 5. Что сделано в репозитории

- Добавлен **docs/REPORT-DEPLOY-STATUS-20260305.md** (инвентаризация платформ и команд).
- **package.json (root):** `packageManager: "bun@1.2.15"`, добавлен скрипт `test` (проброс в apps/web).
- **Workflows:** единая установка из корня — `bun install --frozen-lockfile`; сборка — `bun run cf:build`; убраны setup-node и `npm ci`.
- **bun.lock** обновлён под текущий набор зависимостей.

---

## 6. Чеклист: как повторить и довести до зелёного состояния

1. **Установка (локально):**  
   `bun install --frozen-lockfile` (из корня репо).

2. **Сборка (локально):**  
   `bun run build` — next build;  
   `bun run cf:build` — OpenNext для Cloudflare.

3. **CI:**  
   Push в `main` → запуск deploy-cloudflare-prod; в PR в `main` / push в `feature/**` → CI (lint, test, cf:build). Дополнительных установок не делать.

4. **Домен и DNS:**  
   В Cloudflare Dashboard привязать домены aistroyka.ai и www.aistroyka.ai к Worker aistroyka-web-production; проверить A/AAAA или CNAME для apex и CNAME для www по инструкции Cloudflare.

5. **Env:**  
   В Cloudflare (Variables and Secrets) задать перечисленные выше переменные для production; при необходимости добавить секреты в GitHub для сборки.

6. **Проверка после деплоя:**  
   - `curl -sS -o /dev/null -w "%{http_code}" https://aistroyka.ai/`  
   - `curl -sS -o /dev/null -w "%{http_code}" https://www.aistroyka.ai/`  
   - `curl -sS https://aistroyka.ai/api/v1/health`  
   Ожидание: 200 (или 302 для главной) и JSON от health без ошибок.

7. **Улучшения на потом:**  
   - Обновить Next.js до патч-версии с фиксом безопасности (см. предупреждение в логах).  
   - Явно зафиксировать в документации выбор canonical-домена (www vs apex) и редиректы.

---

## Коммиты

- `c98080b4` — docs: add deploy status inventory (REPORT-DEPLOY-STATUS-20260305)
- `4dce99a0` — chore(ci): unify bun workspace install
