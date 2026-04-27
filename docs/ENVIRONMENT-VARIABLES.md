# Environment Variables — Aistroyka (Production Runtime)

Список переменных окружения для production-деплоя. Не коммитить реальные значения.
Каноничный runtime в текущем репо: Cloudflare Workers (через `wrangler`/GitHub workflows).
Vercel может встречаться как исторический/дополнительный путь и доменный редирект.

---

## Обязательные для работы приложения

| Variable | Описание | Пример (не подставлять секреты) |
|----------|----------|----------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный anon-ключ Supabase | (из Supabase Dashboard → API) |
| `NEXT_PUBLIC_APP_URL` | Канонический URL сайта (без trailing slash) | `https://aistroyka.ai` |
| `NODE_ENV` | Режим запуска | `production` |

Без этих переменных приложение не пройдёт валидацию (middleware, auth, callbacks).

---

## Обязательные для серверных функций (API, jobs, admin)

| Variable | Описание |
|----------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key из Supabase (секрет). Нужен для server-side операций, cron, admin. |

В production при отсутствии ключа часть функций будет ограничена (предупреждение в логах).

---

## Cron / защита job-эндпоинтов (production)

| Variable | Описание |
|----------|----------|
| `REQUIRE_CRON_SECRET` | В production рекомендуется `true`. |
| `CRON_SECRET` | Секрет для вызова cron/job-эндпоинтов (задать при `REQUIRE_CRON_SECRET=true`). |

---

## AI (опционально, но рекомендуется для pilot)

| Variable | Описание |
|----------|----------|
| `OPENAI_API_KEY` | Ключ OpenAI для vision/analysis. |
| `AI_ANALYSIS_URL` | Опционально: URL in-app AI endpoint (по умолчанию `NEXT_PUBLIC_APP_URL` + `/api/ai/analyze-image`). |
| `ANTHROPIC_API_KEY` | Опционально: альтернативный vision-провайдер. |
| `GOOGLE_AI_API_KEY` / `GEMINI_API_KEY` | Опционально: Google AI. |

Хотя бы один из `OPENAI_API_KEY` или `AI_ANALYSIS_URL` нужен для полноценной работы AI.

---

## Billing (Stripe, опционально)

| Variable | Описание |
|----------|----------|
| `STRIPE_SECRET_KEY` | Секретный ключ Stripe. |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret для Stripe. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Публичный ключ Stripe для клиента. |

---

## Push-уведомления (FCM / APNS, опционально)

| Variable | Описание |
|----------|----------|
| `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`, `FCM_TOKEN_URI` | FCM (Android). |
| `APNS_KEY`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID` | APNS (iOS). |

---

## Дополнительные (опционально)

| Variable | Описание |
|----------|----------|
| `NEXT_PUBLIC_APP_ENV` | Метка окружения для клиента, например `production` или `staging`. |
| `LOG_LEVEL` | Уровень логов: `info`, `debug`, `warn`, `error`. |
| `OPENAI_VISION_MODEL` | Модель vision (по умолчанию `gpt-4o`). |
| `OPENAI_COPILOT_MODEL` | Модель для Copilot (текст / SSE), по умолчанию `gpt-4o-mini`. |
| `OPENAI_COPILOT_TIMEOUT_MS` | Таймаут одной попытки HTTP к OpenAI для Copilot (15 000–120 000, по умолчанию 60 000). |
| `OPENAI_COPILOT_MAX_RETRIES` | Число **дополнительных** повторов при 429/5xx для Copilot (0–5, по умолчанию 2). |
| `OPENAI_TRANSCRIPTION_MODEL` | Модель Whisper (по умолчанию `whisper-1`). |
| `OPENAI_TRANSCRIPTION_TIMEOUT_MS` | Таймаут запроса транскрибации (30 000–180 000, по умолчанию 120 000). |
| `OPENAI_TRANSCRIPTION_MAX_RETRIES` | Доп. попытки при 429/5xx для транскрибации (0–5, по умолчанию 1). |
| `WEBHOOK_INCOMING_SECRET` | Секрет для входящих webhooks (если используется). |

---

## Запрещённые в production

Не задавать или явно отключать в production:

- `DEBUG_AUTH`
- `DEBUG_DIAG`
- `ENABLE_DIAG_ROUTES`

При необходимости отладки только с одного хоста можно использовать `ALLOW_DEBUG_HOSTS=hostname`.

---

## Где задавать в production

При Cloudflare Workers:

1. Runtime vars (`NEXT_PUBLIC_*` и др.) задаются в `wrangler.toml`/`wrangler.deploy.toml` для нужного env.
2. Секреты задаются через `wrangler secret put` или через GitHub Actions secrets для deploy workflows.
3. После изменения переменных требуется новый deploy.

При использовании Vercel (legacy/fallback окружения):

1. Vercel Dashboard → выбранный проект → **Settings** → **Environment Variables**.
2. Добавить каждую переменную, выбрать окружения: **Production**, **Preview** (по желанию).
3. Секреты (ключи, пароли) помечать как **Sensitive** (скрыты в логах).

После изменения переменных пересобрать деплой (Redeploy/Deploy).

---

## GitHub Actions: Playwright pilot E2E (опционально)

Репозиторные **Actions secrets** (Settings → Secrets and variables → Actions), если нужен ручной или post-deploy прогон `.github/workflows/pilot-e2e-audit.yml`:

| Secret | Описание |
|--------|----------|
| `PILOT_E2E_BASE_URL` | Базовый URL без trailing slash, например `https://staging.aistroyka.ai`. |
| `PILOT_E2E_EMAIL` | Email пользователя для логина в браузерных тестах. |
| `PILOT_E2E_PASSWORD` | Пароль. |
| `PILOT_E2E_PROJECT_ID` | Опционально: UUID проекта; иначе берётся первый из API после входа. |

После `pilot-smoke` workflow **Deploy Cloudflare (Staging)** может вызывать тот же аудит с `continue-on-error: true`, поэтому отсутствие секретов не блокирует деплой, но шаг завершится ошибкой до установки зависимостей.

---

## Проверка готовности

Из корня репозитория (с установленными зависимостями):

```bash
NODE_ENV=production node scripts/validate-release-env.mjs
```

Скрипт использует `apps/web/lib/config/release-env.ts` и выводит отчёт по наличию и безопасности переменных.
