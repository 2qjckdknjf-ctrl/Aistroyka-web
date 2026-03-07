# Production smoke green — отчёт и runbook

**Дата:** 2026-03-07  
**Ветка:** release/phase5-2-1  
**Домен production:** https://aistroyka.ai  
**Worker:** aistroyka-web-production (Cloudflare Workers, OpenNext)

---

## 1. Что было сделано

### Stage 0 — Подготовка
- **Git:** проверен, ветка `release/phase5-2-1`, чисто.
- **Тип деплоя:** Next.js на Cloudflare Workers через OpenNext; `wrangler.toml` → `[env.production]` name = `aistroyka-web-production`. Домен aistroyka.ai обслуживается этим Worker (маршруты в Dashboard).
- **Исходное состояние:** `GET /api/v1/health` → **500**, `POST /api/v1/admin/jobs/cron-tick` → **500**.

### Stage 1 — Supabase (MCP)
- **MCP:** `plugin-supabase-supabase` — `list_projects`, `get_project_url`, `get_publishable_keys` для проекта **AISTROYKA** (id: `vthfrxehrursfloevnlp`).
- **Получено:**
  - **SUPABASE_URL (Project API URL):** `https://vthfrxehrursfloevnlp.supabase.co`
  - **anon key (public):** получен через `get_publishable_keys` (legacy anon), значение не логировалось.
  - **service_role key:** MCP не возвращает (только anon/publishable); значение нужно брать вручную: **Supabase Dashboard → Project Settings → API → service_role**.
- **Проверка:** запрос к `https://vthfrxehrursfloevnlp.supabase.co/rest/v1/tenants?select=id&limit=1` с anon key → **200**.

### Stage 2 — Cloudflare (wrangler, не MCP)
- **MCP Cloudflare:** плагин `plugin-cloudflare-cloudflare-docs` только для документации; установка переменных через него недоступна.
- **Через wrangler CLI:**
  - Установлены секреты для **aistroyka-web-production**:
    - **NEXT_PUBLIC_SUPABASE_URL** = Project API URL (из MCP)
    - **NEXT_PUBLIC_SUPABASE_ANON_KEY** = anon key (из MCP)
  - **SUPABASE_SERVICE_ROLE_KEY** в Cloudflare **не задан** (нет значения из MCP; задать вручную в Dashboard или `wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production`).
- **Список секретов (только имена):** NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, OPENAI_API_KEY. SUPABASE_SERVICE_ROLE_KEY отсутствует.

### Stage 3 — Деплой
- Выполнены: `bun run cf:build`, `npx wrangler deploy --env production`. Деплой прошёл успешно (Version ID в логах).
- **Health после деплоя:** по-прежнему **500** (Internal Server Error). Возможные причины: env на Workers не попадают в `process.env` в рантайме Next/OpenNext, либо ошибка до входа в handler (middleware/адаптер).

### Изменения в коде (без секретов)
- **lib/controllers/health.ts:** для проверки БД в health используется только URL + anon key (`createClient` из `@supabase/supabase-js`, без cookies), чтобы не зависеть от `cookies()` в Edge/Workers.
- **app/api/v1/health/route.ts:** добавлена обработка ошибок: при исключении в `getHealthResponse()` или при неуспешной валидации контракта возвращается **503** с телом, соответствующим контракту (без 500). Внешний try/catch возвращает 503 при любой необработанной ошибке.

---

## 2. Переменные окружения (только имена)

**Уже заданы в production Worker (через wrangler):**
- NEXT_PUBLIC_SUPABASE_URL  
- NEXT_PUBLIC_SUPABASE_ANON_KEY  
- NEXT_PUBLIC_APP_URL  
- OPENAI_API_KEY  

**Нужно задать вручную для полного smoke green:**
- **SUPABASE_SERVICE_ROLE_KEY** — взять в Supabase Dashboard → Project Settings → API → service_role (secret). Задать: Cloudflare Dashboard → Workers & Pages → aistroyka-web-production → Settings → Variables and Secrets, либо `echo -n "<key>" | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production` из `apps/web`.
- **CRON_SECRET** (если включён REQUIRE_CRON_SECRET) — задать в Worker и передавать в smoke в заголовке `x-cron-secret`.

---

## 3. Результаты проверок (sanitized)

| Endpoint | Ожидание | Факт |
|----------|----------|------|
| GET /api/v1/health | 200 или 503 | **500** (Internal Server Error) |
| POST /api/v1/admin/jobs/cron-tick | 200/202 или 503 | **500** |
| GET /api/v1/ops/metrics | 200 при AUTH_HEADER | не проверялось (нет 200 по health) |

**Smoke:** не запускался до достижения 200 по health/cron-tick.

---

## 4. Runbook — как довести smoke до green

1. **Задать SUPABASE_SERVICE_ROLE_KEY** в production Worker (см. выше). После этого перезапустить деплой не обязательно — секреты подхватываются при следующем запросе (при необходимости — повторный деплой).
2. **Проверить health:**  
   `curl -sS https://aistroyka.ai/api/v1/health`  
   Ожидается **200** с `"ok":true,"db":"ok"` или **503** с валидным JSON (не 500).
3. **Проверить cron-tick:**  
   - Без секрета:  
     `curl -sS -X POST https://aistroyka.ai/api/v1/admin/jobs/cron-tick -H "content-type: application/json"`  
   - С секретом (если включён):  
     `curl -sS -X POST https://aistroyka.ai/api/v1/admin/jobs/cron-tick -H "content-type: application/json" -H "x-cron-secret: <CRON_SECRET>"`  
   Ожидается **200** или **202** (не 503 admin_not_configured после установки SUPABASE_SERVICE_ROLE_KEY).
4. **Получить AUTH_HEADER для ops/metrics:**  
   - Вариант A: использовать существующего пользователя-менеджера (email/password), получить токен:  
     `POST https://vthfrxehrursfloevnlp.supabase.co/auth/v1/token?grant_type=password`  
     с телом `{"email":"...","password":"..."}` и заголовком `apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>`. В ответе взять `access_token` → `AUTH_HEADER="Authorization: Bearer <access_token>"`.  
   - Вариант B: создать smoke-пользователя через Supabase Dashboard (Auth → Users) или Admin API, выдать ему роль в tenant (tenant_members), затем получить токен так же, как в A.
5. **Запуск smoke (локально, без коммита секретов):**  
   ```bash
   export BASE_URL=https://aistroyka.ai
   export AUTH_HEADER="Authorization: Bearer <token>"
   # при необходимости:
   export CRON_SECRET="<cron_secret>"
   ./scripts/smoke/pilot_launch.sh
   ```  
   Успех: cron-tick OK, ops/metrics OK, вывод счётчиков.

---

## 5. Smoke user (если создавался)

В рамках этой сессии **новый smoke-пользователь не создавался**. Для ops/metrics можно использовать существующего менеджера или создать отдельного пользователя (например `smoke.manager+<timestamp>@aistroyka.ai`) через Dashboard/Admin API, выдать ему членство в tenant с ролью admin/owner и затем получать токен по паролю. Пароль и токен в репозиторий и отчёты не помещать; при необходимости пользователя отключить/удалить в Supabase Auth.

---

## 6. Итог

- **SMOKE GREEN:** **no** — health и cron-tick на production возвращают 500; SUPABASE_SERVICE_ROLE_KEY в Worker не задан; env/рантайм на OpenNext/Workers, возможно, не доходят до кода (500 до входа в handler).
- **Критичный следующий шаг:** задать **SUPABASE_SERVICE_ROLE_KEY** в production Worker и убедиться, что переменные окружения доступны в рантайме (при необходимости — проверить конфигурацию OpenNext/Cloudflare для env). После этого повторить проверки по п. 2–5.
