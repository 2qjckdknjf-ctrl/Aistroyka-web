# Phase 2 — Укрепление контракта API (отчёт)

**Дата:** 2026-04-27  
**Основание:** `AISTROYKA_TZ.md` §10 Phase 2 (инвентарь `/api/v1`, валидация, envelope, legacy, contracts/OpenAPI).

---

## A. Статус фазы

| Поле | Значение |
|------|----------|
| **Статус** | **PARTIAL** |
| **Следующая фаза разрешена** | **YES** — с зафиксированным бэклогом по envelope и покрытию Zod |

Инвентаризация и классификация выполнены **по дереву файлов** и выборочной проверке кода; полный построчный аудит **каждого** из ~197 v1-маршрутов не делался (оценочно 2–3 инженеро-дня на ручной чеклист без автоматизации).

---

## B. Инвентарь маршрутов

### B.1. Объёмы (команда из корня `apps/web/app/api`)

```bash
find . -name 'route.ts' | wc -l          # → 222
find ./v1 -name 'route.ts' | wc -l       # → 197
```

| Класс | Количество `route.ts` | Путь |
|--------|------------------------|------|
| **Канонический v1** | **197** | `app/api/v1/**/route.ts` |
| **Не-v1 (legacy / parallel)** | **25** | `app/api/**/*.ts`, исключая `./v1/*` |

### B.2. Список не-v1 маршрутов (compatibility layer по ТЗ §4.2)

Все пути относительно `apps/web/app/api/`:

- `_debug/auth/route.ts` — **diagnostic**
- `activation/status/route.ts`
- `ai/analyze-image/route.ts`
- `analysis/process/route.ts`
- `auth/login/route.ts`
- `contact/route.ts`
- `diag/supabase/route.ts` — **diagnostic**
- `health/auth/route.ts`, `health/route.ts` — **health** (дубли v1)
- `invite/route.ts`
- `projects/route.ts`, `projects/[id]/route.ts`, `projects/[id]/upload/route.ts`, `projects/[id]/poll-status/route.ts`
- `projects/[id]/jobs/[jobId]/trigger/route.ts`, `projects/[id]/media/[mediaId]/trigger/route.ts`
- `system/health/route.ts`, `system/metrics/route.ts`
- `tenant/accept-invite`, `invitations`, `invite`, `members`, `profile`, `revoke`
- `webhooks/incoming/route.ts`

**Примечание:** часть дублирует `v1` (health, tenant, projects, ai, analysis) — соответствует правилу ТЗ «старые `/api/*` — только compatibility».

### B.3. Внутренние / диагностические внутри v1

| Префикс / файл | Назначение |
|----------------|------------|
| `v1/diag/supabase` | диагностика |
| `v1/debug/auth` | отладка auth |
| `v1/system/health`, `v1/system/metrics` | системные |
| `v1/health`, `v1/health/auth` | публичные/авторизационные проверки |
| `v1/owner/*` | platform owner cabinet (отдельный периметр) |

---

## C. Контракты (`packages/contracts`)

- Пакет **`@aistroyka/contracts`**: TypeScript + **Zod**, сборка `tsc`, тесты Vitest.
- **Worker-critical:** схемы `WorkerReportSubmitRequestSchema`, `WorkerReportCreateRequestSchema`, `WorkerReportAddMediaRequestSchema` в `packages/contracts/src/schemas/worker.schema.ts`, используются в `app/api/v1/worker/report/*`.
- **OpenAPI:** отдельного артефакта `openapi.yaml` / генерации спеки в репозитории **не найдено** (поиск по `packages/contracts`) — **GAP** относительно формулировки ТЗ «OpenAPI update».

---

## D. Response envelope (`lib/api-gateway/api-response.ts`)

Задекларирован единый тип:

- успех: `{ data: T, meta?: { requestId?, at? } }`
- ошибка: `{ error: { code, message, details? }, meta? }`
- хелперы `success`, `apiError`, `errorToStatus`, `isApiError`.

**Факт использования в маршрутах:** импорт из **`@/lib/api-gateway`** (re-export `success` / `apiError` из `api-response.ts`) на дату отчёта **почти только в эталонном** `v1/users/route.ts` (в файле явно указано «scaffold»); остальные v1-роуты идут мимо envelope. Подавляющее большинство v1-роутов отвечает через **`NextResponse.json(...)`** с **разными** формами тел:

- плоские объекты успеха (`{ reportId, jobIds, … }` в worker submit);
- `{ error: string | …, code?: … }` при ошибках;
- иногда обёртка `data` для совместимости с мобильными DTO (зависит от эндпоинта).

**Вывод:** требование ТЗ «все ответы — единый envelope» **не выполнено**; worker-критичные пути **строги по Zod и idempotency**, но **не унифицированы по JSON-оболочке**.

---

## E. Валидация mutating-запросов (выборочно)

| Область | Паттерн | Оценка |
|---------|---------|--------|
| Worker report create/add-media/submit, day start/end | `*.safeParse` + Zod из `@aistroyka/contracts` | **строго** |
| Lite idempotency | `requireLiteIdempotency` на критичных POST | **есть** (submit и др.) |
| Прочие POST/PATCH под `projects/[id]/...` | часто ручной разбор + доменные сервисы | **неравномерно**; нужен инвентарь |

Рекомендация: автоматизировать поиск POST/PUT/PATCH без `safeParse` / без доменного валидатора (скрипт + allowlist исключений в документе).

---

## F. Приёмка Phase 2 (по ТЗ)

| Критерий ТЗ | Статус |
|-------------|--------|
| Инвентарь всех routes | **PARTIAL** — v1 + legacy списки зафиксированы |
| Классификация v1 / legacy / internal / diagnostic | **PARTIAL** — правила и примеры заданы; SCIM и часть admin — «internal enterprise» |
| Все mutating endpoints валидируются | **OPEN** — нет полного доказательства |
| Worker-critical API strict | **PARTIAL → близко к YES** на create/submit/add-media/day |
| Единый error envelope | **OPEN** |
| Contracts exports | **PASS** (пакет собирается в CI) |
| OpenAPI | **OPEN** |

---

## G. Рекомендации (бэклог)

1. **Envelope:** либо постепенная миграция v1 на `success()` / `apiError()` + тонкий адаптер для мобильных клиентов, либо документировать **два** поддерживаемых профиля (legacy flat vs envelope) с датой отключения legacy.
2. **OpenAPI:** сгенерировать из Zod/ручной спеки минимум **worker + sync + media** для мобильных команд.
3. **Скрипт:** `scripts/api-inventory.mjs` — вывод CSV: path, methods, hasZod, usesEnvelope.
4. **Legacy `/api/*`:** таблица редиректов/deprecation или явное «frozen» с ссылкой из README API.

---

## H. Статус по шаблону ТЗ §12

- **PHASE STATUS:** PARTIAL  
- **NEXT PHASE ALLOWED:** YES  
- **VERIFIED:** счётчики маршрутов; пример worker submit + contracts; наличие `api-response.ts`; отсутствие массового использования envelope  
- **NEXT WORKSTREAM:** Phase 3 (pilot flow) + параллельно пункт 1–3 бэклога Phase 2 по мере касания маршрутов
