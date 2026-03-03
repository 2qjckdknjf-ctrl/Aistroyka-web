# AI Module — контракт, конфиг, расположение кода

Краткий справочник по модулю анализа изображений стройплощадки (vision → structured result).

## Контракт

- **Запрос:** `POST` с JSON `{ image_url }` (обязательно), опционально `media_id`, `project_id`.
- **Ответ 200:** `{ stage, completion_percent, risk_level, detected_issues, recommendations }`.
  - `stage` — фаза стройки (см. промпт).
  - `completion_percent` — 0–100.
  - `risk_level` — `"low"` | `"medium"` | `"high"`.
  - `detected_issues`, `recommendations` — массивы строк.
- **Ошибки:** 400 (тело, нет/пустой image_url, невалидный URL, не http(s), в проде не https), 413 (тело > 100 KB по Content-Length), 502/504 (OpenAI), 503 (нет ключа). image_url проверяется: валидный URL, только http/https, в production только https, длина ≤ 2048.

Типы: `apps/web/lib/ai/types.ts`. Промпт: `apps/web/lib/ai/prompts.ts`. Фазы (единый список): `apps/web/lib/ai/stages.ts`. Нормализация и парсинг JSON: `apps/web/lib/ai/normalize.ts`. После ответа модели: normalize → sanitize (обрезка/дедуп issues и recommendations) → калибровка risk_level; вызов OpenAI с `temperature: 0` для стабильного JSON. Тесты: `npm run test` (vitest: `lib/ai/*.test.ts`, `app/api/ai/analyze-image/route.test.ts`, `app/api/analysis/process/route.test.ts` — валидация, 503, runOneJob и process route). Фабрика: `lib/ai/test-helpers.ts` (`createMockAnalysisResult`). В CI: `.github/workflows/web-ci.yml` (Web CI) запускает тесты при push/PR в main.

## Где что лежит

| Назначение | Путь |
|------------|------|
| API анализа (OpenAI Vision) | `apps/web/app/api/ai/analyze-image/route.ts` |
| Промпт и текст запроса | `apps/web/lib/ai/prompts.ts` |
| Типы и type guard | `apps/web/lib/ai/types.ts` |
| Нормализация stage, парсинг JSON (в т.ч. trailing comma), sanitize | `apps/web/lib/ai/normalize.ts` |
| Калибровка risk_level по issues (ключевые слова, количество) | `apps/web/lib/ai/riskCalibration.ts` |
| Канонический список фаз (для промпта и нормализации) | `apps/web/lib/ai/stages.ts` |
| Обработка одного задания (web) | `apps/web/lib/ai/runOneJob.ts` |
| iOS: процессор заданий | `ios/Aistroyka/Analysis/Data/AnalysisJobProcessor.swift` |
| iOS: создание заданий и экран | `ios/Aistroyka/Analysis/Presentation/AnalysisJobsView.swift` |

Подробная схема «сайт + движок + ИИ»: [unified-system-ai.md](./unified-system-ai.md).

## Цепочка обработки (analyze-image)

1. Проверка OPENAI_API_KEY → 503 при отсутствии.
2. Валидация тела: JSON, Content-Length ≤ 100 KB → 400/413.
3. Проверка image_url (обязателен, URL, протокол, длина ≤ 2048) → 400.
4. Запрос к OpenAI Vision (gpt-4o, temperature=0, response_format=json_object).
5. Парсинг ответа (JSON, с учётом trailing comma и markdown).
6. Нормализация: stage → допустимая фаза, completion_percent → 0–100, risk_level → low/medium/high, фильтрация массивов.
7. Санитизация: обрезка и дедуп issues/recommendations (лимит длины и количества).
8. Калибровка risk_level по ключевым словам и количеству issues.
9. Лог (JSON), заголовок X-AI-Duration-Ms, ответ 200.

## Лимиты

| Параметр | Лимит | Где |
|----------|--------|-----|
| Размер тела запроса (Content-Length) | 100 KB | analyze-image route |
| Длина image_url | 2048 символов | analyze-image route |
| Элементов в detected_issues / recommendations | 30 | normalize.ts (sanitize) |
| Длина одной строки в issues / recommendations | 500 символов | normalize.ts (sanitize) |

## Переменные окружения (web)

| Переменная | Назначение | По умолчанию |
|------------|------------|--------------|
| `OPENAI_API_KEY` | Ключ OpenAI (для встроенного analyze-image) | — |
| `OPENAI_VISION_MODEL` | Модель (vision) | `gpt-4o` |
| `OPENAI_VISION_TIMEOUT_MS` | Таймаут запроса к OpenAI (30k–120k) | `85000` |
| `OPENAI_RETRY_ON_5XX` | Повторы при 5xx от OpenAI | `1` |
| `AI_ANALYSIS_URL` | URL эндпоинта анализа (для воркера / iOS) | см. `.env.example` |
| `AI_REQUEST_TIMEOUT_MS` | Таймаут вызова AI в runOneJob (30k–120k) | `90000` |
| `AI_RETRY_ATTEMPTS` | Число попыток в runOneJob (1–5) | `3` |

## iOS

- **AI_ANALYSIS_URL** задаётся в `ios/Config/Secrets.xcconfig` и подставляется в `Info.plist`.
- При открытии экрана «Задания анализа» или после создания задания приложение обрабатывает до 5 заданий подряд (dequeue → AI → complete/fail), затем обновляет список.
- Запрос к AI: таймаут 90 с, до 2 повторов при 5xx или сетевой ошибке (`isRetryableError`).

## Разработка

- **Тесты:** из каталога `apps/web`: `npm run test` (vitest). Тесты роута проверяют только валидацию и 503 без вызова OpenAI; для сценариев с моком OpenAI можно расширить `route.test.ts`.
- **Линт:** `npm run lint`.
- **Новый тест:** добавьте `*.test.ts` рядом с модулем или в `app/api/.../route.test.ts`. Для моков используйте `vi.stubEnv`, `createMockAnalysisResult` из `lib/ai/test-helpers.ts`.
- **Лимит image_url:** 2048 символов (константа в `route.ts`).
- **Логирование:** каждый вызов analyze-image пишет одну строку JSON в stdout: `event: "ai_analyze_image"`, `status`, `duration_ms`, `ts` (ISO); при success — `stage`, `risk_level`, `issues_count`; при failure — `error`, `http_status`. Ответ 200 содержит заголовок `X-AI-Duration-Ms` (миллисекунды). Аналогично, runOneJob пишет `event: "ai_process_one_job"` с `job_id`, `status`, `duration_ms`, `error_type` (при failure).
