# Phase 0 — Карта архитектуры (Architecture Map)

**Дата:** 2026-03-23  
**Охват:** высокоуровневая карта для навигации по репозиторию; детализация RLS и всех доменов — в последующих аудитах.

---

## 1. Логическая система

```mermaid
flowchart TB
  subgraph clients [Клиенты]
    Web[Next.js Web RU/EN/ES/IT]
    iOS[AiStroykaManager / AiStroykaWorker]
    Android[AiStroykaManager / AiStroykaWorker]
  end

  subgraph edge [Периметр]
    MW[middleware / locale / auth gates]
  end

  subgraph app [apps/web]
    UI[App Router pages]
    API[Route Handlers api and api/v1]
    Domain[lib/domain/* сервисы и репозитории]
    Platform[lib/platform/* биллинг plan-fit лимиты]
  end

  subgraph data [Данные]
    SB[(Supabase Postgres + Storage + Auth)]
  end

  subgraph packages [Пакеты]
    Contracts[@aistroyka/contracts]
  end

  Web --> MW --> UI
  Web --> API
  iOS --> API
  Android --> API
  UI --> Domain
  API --> Domain
  Domain --> SB
  Domain --> Contracts
```

---

## 2. Физическая карта репозитория

| Зона | Путь | Назначение |
|------|------|------------|
| Веб-приложение | `apps/web/` | Next.js, UI, API, тесты Vitest, Playwright, Supabase migrations |
| Контракты | `packages/contracts/` | Общие типы/схемы для API и клиентов |
| OpenAPI | `packages/contracts-openapi/` | Производные артефакты контрактов |
| iOS | `ios/AiStroykaManager`, `ios/AiStroykaWorker`, `ios/Shared` | Нативные приложения и общий код |
| Android | `android/` + `android/shared` | Gradle, зеркало iOS по ролям |
| Документация | `docs/` | Архитектура, продукт, отчёты, ENV |
| Paperclip (vendored) | `paperclip/` | Локальная оркестрация агентов; не часть продуктового workspace |
| Автоматизация | `.github/workflows/` | Деплой CF, миграции, смоук |
| Скрипты | `scripts/`, `apps/web/scripts/` | релиз, смоук, миграции, CF |
| **Внимание:** возможный legacy/дубль | `/lib`, `/components`, `/middleware.ts` в **корне** репо | Требует сверки с `apps/web` в Closure A |

---

## 3. Основные потоки данных (упрощённо)

1. **Сессия и тенант:** Supabase Auth; серверные клиенты в `apps/web`; middleware защищает дашборд и локали.
2. **Менеджер:** страницы `app/[locale]/(dashboard)/...` → вызовы `app/api/v1/...` → `lib/domain/*`.
3. **Исполнитель:** REST `/api/v1/worker/*` + sync — общение мобильных клиентов с бэкендом.
4. **Документы:** таблицы из миграций `project_documents` + домен `lib/domain/documents/*` + загрузки/storage (детали — в документе документного E2E).
5. **Биллинг / план:** `lib/platform/billing-readiness`, `plan-fit`, Stripe webhook routes под `api/v1/billing/*`.
6. **Уведомления:** `api/v1/notifications/*`, миграции manager_notifications.

---

## 4. Границы ответственности

| Слой | Ответственность |
|------|-----------------|
| `app/api/v1/*` | HTTP, валидация входа, коды ответов, вызов домена |
| `lib/domain/*` | Бизнес-правила, политики документов, проекты, отчёты |
| `lib/platform/*` | Подписки, лимиты, поверхности апгрейда, биллинг-готовность |
| `packages/contracts` | Стабильные контракты для web/mobile/генерации |
| Миграции SQL | Схема, RLS-политики (проверять по каждой таблице при работе с фичей) |

---

## 5. Известные архитектурные вопросы (для Closure A)

- Два возможных «центра» фронта/утилит (корень vs `apps/web`).
- Большое число админских и аналитических API — для MVP нужен **минимальный поддерживаемый контур**.
- Согласование narrative в `docs/architecture/*` с фактическим primary deploy: **GitHub Actions prod → Cloudflare**; конфиг **Vercel** в `apps/web/vercel.json` остаётся альтернативным путём — нужна явная политика для одного публичного origin.

---

## 6. Связанные документы

- Бэклог: `PHASE0_MASTER_BACKLOG.md`
- План исполнения: `PHASE0_EXECUTION_PLAN.md`
- Дорожная карта MVP: `MVP_EXECUTION_ROADMAP.md`
