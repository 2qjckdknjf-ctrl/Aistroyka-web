# Единая система: сайт + движок + ИИ

Один деплой веб-приложения покрывает весь цикл: загрузка фото → очередь заданий → анализ ИИ → результат в БД и в UI.

## Схема

```
[Пользователь] → [Сайт Next.js]
                       │
                       ├─ Auth, проекты, загрузка в Storage
                       ├─ create_analysis_job (RPC) → запись в analysis_jobs
                       │
                       └─ При наличии активных заданий (polling):
                              POST /api/v1/analysis/process   ← канонический HTTP path
                              (legacy adapter: POST /api/analysis/process)
                                   │
                                   ├─ TenantContext (server-derived ctx.tenantId only)
                                   ├─ authorize analysis:trigger (member|admin|owner)
                                   ├─ dequeue_tenant_job(p_tenant_id) → claim_job_execution
                                   ├─ GET media (file_url, project_id) scoped by tenant_id
                                   ├─ POST AI_ANALYSIS_URL (тело: media_id, image_url, project_id)
                                   │      │
                                   │      └─ Если AI_ANALYSIS_URL = этот же сайт:
                                   │            POST /api/ai/analyze-image
                                   │            → OpenAI Vision (gpt-4o, temperature=0)
                                   │            → normalize → sanitize → risk calibration → AnalysisResult
                                   │
                                   └─ complete_analysis_job(result) → ai_analysis, job completed
```

**Важно (Phase 2B.1):** пользовательский HTTP path **не** вызывает глобальный `dequeue_job`. Tenant id не принимается из body, query или произвольного client header — только из серверного `TenantContext`.

## Настройка (один бокс)

1. **Supabase:** базовые миграции проекта и бакет `media` / Auth — по состоянию окружения (могут быть уже применены).
   Отдельно: миграция Phase 2B.1
   `apps/web/supabase/migrations/20260725143000_dequeue_tenant_job.sql`
   на момент этого документа **НЕ применена** ни на staging, ни на production.
   Код Phase 2B.1 (tenant-scoped `dequeue_tenant_job` на user HTTP path) **нельзя выкладывать**, пока эта миграция не применена.
   Безопасный порядок: staging migration → staging verification → production migration → application deploy.
   Не считать staging или production уже обновлёнными этим документом.
2. **Переменные окружения** (см. `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only; нужен для job RPCs (service_role)
   - `AI_ANALYSIS_URL` — URL эндпоинта анализа. Для единой системы укажите тот же хост:
     **Dev:** `http://localhost:3000/api/ai/analyze-image`
     **Prod:** `https://your-domain.com/api/ai/analyze-image`
   - `OPENAI_API_KEY` — ключ OpenAI (нужен для встроенного `/api/ai/analyze-image`).

3. Запуск: `npm run dev` (или деплой). Отдельный воркер не нужен для базового сценария.

## Контракт AI

- **Вход:** `POST` с JSON `{ media_id, image_url, project_id }`.
- **Выход:** JSON `{ stage, completion_percent, risk_level, detected_issues, recommendations }` (см. `lib/ai/types.ts`).

Встроенный эндпоинт `/api/ai/analyze-image` реализует контракт через OpenAI Vision (temperature=0), затем нормализует ответ (stage, числа), санитизирует списки issues/recommendations и применяет калибровку риска по ключевым словам — см. `lib/ai/normalize.ts`, `lib/ai/riskCalibration.ts`.

## Проверка после деплоя

После запуска или деплоя проверьте готовность:

```bash
curl -s https://your-app.com/api/health
```

Ожидаемый ответ при готовности: `{"ok":true,"db":"ok","aiConfigured":true,"openaiConfigured":true}`.

- `ok: false` или `db: "error"` — нет доступа к БД или миграции не применены.
- `aiConfigured: false` — задайте `AI_ANALYSIS_URL`.
- `openaiConfigured: false` — при встроенном AI задайте `OPENAI_API_KEY`.

В CI/CD или скрипте деплоя можно вызвать: `./scripts/health-check.sh https://your-app.com` (скрипт проверяет HTTP 200 и `ok: true`, exit 0 только при успехе).

## iOS в одной системе

Приложение iOS использует тот же Supabase и тот же контракт AI. Чтобы всё работало как единая система:

1. **Тот же Supabase:** в `Config/Secrets.xcconfig` укажите те же `SUPABASE_URL` и `SUPABASE_ANON_KEY`, что и у веб-приложения.
2. **AI через сайт:** задайте `AI_ANALYSIS_URL` на эндпоинт веб-приложения, например
   `https://your-domain.com/api/ai/analyze-image`
   Тогда веб (polling → `POST /api/v1/analysis/process`) обрабатывает очередь на сервере через `dequeue_tenant_job`; ключ OpenAI не нужен в приложении.
3. **Либо только веб обрабатывает:** можно не задавать `AI_ANALYSIS_URL` в iOS — задания создаются с телефона, обрабатываются при открытии сайта или trusted background worker.

Проекты, медиа и задания общие: созданное на сайте или в приложении видно везде (в пределах tenant isolation).

## Опционально: внешний воркер (engine)

Для высокой нагрузки можно запускать **доверенный** background worker из `engine/Aistroyk` (`npm run worker`) с `SUPABASE_SERVICE_ROLE_KEY` и `AI_ANALYSIS_URL`.

Разделение контуров:

| Контур | RPC | Назначение |
| --- | --- | --- |
| Web HTTP (`POST /api/v1/analysis/process`, legacy adapter) | `dequeue_tenant_job(p_tenant_id)` | Только jobs **своего** tenant; tenant из серверного context |
| Trusted background worker | `dequeue_job` (global) | Глобальная очередь для сервисного воркера |

Веб и воркер **не** являются одинаковыми потребителями одного глобального dequeue на user HTTP path. `AI_ANALYSIS_URL` может указывать на тот же сайт (`/api/ai/analyze-image`) или на отдельный AI-сервис.
