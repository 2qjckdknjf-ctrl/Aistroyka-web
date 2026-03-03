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
                              POST /api/analysis/process
                                   │
                                   ├─ dequeue_job → claim_job_execution
                                   ├─ GET media (file_url, project_id)
                                   ├─ POST AI_ANALYSIS_URL (тело: media_id, image_url, project_id)
                                   │      │
                                   │      └─ Если AI_ANALYSIS_URL = этот же сайт:
                                   │            POST /api/ai/analyze-image
                                   │            → OpenAI Vision (gpt-4o, temperature=0)
                                   │            → normalize → sanitize → risk calibration → AnalysisResult
                                   │
                                   └─ complete_analysis_job(result) → ai_analysis, job completed
```

## Настройка (один бокс)

1. **Supabase:** миграции применены, бакет `media`, Auth.
2. **Переменные окружения** (см. `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AI_ANALYSIS_URL` — URL эндпоинта анализа. Для единой системы укажите тот же хост:  
     **Dev:** `http://localhost:3000/api/ai/analyze-image`  
     **Prod:** `https://your-domain.com/api/ai/analyze-image`
   - `OPENAI_API_KEY` — ключ OpenAI (нужен для встроенного `/api/ai/analyze-image`).

3. Запуск: `npm run dev` (или деплой). Отдельный воркер не нужен.

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
   Тогда и веб (polling → POST /api/analysis/process), и iOS (refresh → processOneJob) будут слать анализ на один и тот же URL; обработка идёт на сервере, ключ OpenAI не нужен в приложении.
3. **Либо только веб обрабатывает:** можно не задавать `AI_ANALYSIS_URL` в iOS — задания создаются с телефона, обрабатываются при открытии сайта или воркером.

Проекты, медиа и задания общие: созданное на сайте или в приложении видно везде.

## Опционально: внешний воркер (engine)

Для высокой нагрузки можно запускать воркер из `engine/Aistroyk` (`npm run worker`) с теми же `SUPABASE_*` и `AI_ANALYSIS_URL`. Тогда задания забирают и воркер, и вызовы `POST /api/analysis/process` с сайта (конкурирующие потребители через `dequeue_job`). `AI_ANALYSIS_URL` может указывать на тот же сайт (`/api/ai/analyze-image`) или на отдельный AI-сервис.
