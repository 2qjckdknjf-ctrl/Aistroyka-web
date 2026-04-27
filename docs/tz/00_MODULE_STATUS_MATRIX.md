# Матрица статуса модулей (Phase 0)

**Дата:** 2026-04-27  
**Основание:** `AISTROYKA_TZ.md` §10 — список областей и шкала статусов.

## Легенда статусов

| Статус | Значение |
|--------|----------|
| **FULL** | Реализовано, синхронизировано, приёмочные критерии модуля в ТЗ закрыты или почти закрыты (есть явные доказательства в коде/тестах). |
| **PARTIAL** | Значимая реализация есть; остаются хвосты UI, контрактов, live-проверки или документации. |
| **OPEN** | Задумано в ТЗ, в репо нет достаточного закрытия или нет сквозной приёмки. |
| **BROKEN** | Известны поломки сборки/тестов/критичных путей (на момент матрицы не зафиксировано — см. Phase 1). |
| **STALE_DOCS** | Документация расходится с кодом (использовать репо как источник истины). |
| **NEEDS_LIVE_VERIFICATION** | Код есть; нужны проверки против реального Supabase/staging/device. |

---

## Матрица (30 областей из ТЗ)

| № | Область | Статус | Краткое обоснование (репо) |
|---|---------|--------|----------------------------|
| 1 | Web public website | **PARTIAL** | Локализованный публичный контур есть; полнота контента/SEO — не инвентаризировалась в Phase 0. |
| 2 | Web dashboard | **PARTIAL** | Большой `(dashboard)` + множество API; приёмка ТЗ («нет мёртвых кнопок», все состояния) — без системного E2E на весь дашборд. |
| 3 | Auth/session | **PARTIAL** | Supabase SSR, middleware, Bearer для API; детали edge-case — live/security аудит. |
| 4 | Tenant/RLS | **PARTIAL** | Миграции и политики развиваются; исторические отчёты указывали на permissive/service role — нужен **актуальный** security pass по `apps/web/supabase/migrations/`. |
| 5 | Projects | **PARTIAL** | CRUD/страницы/API; границы ролей — проверять по маршрутам. |
| 6 | Tasks | **PARTIAL** | API и UI-контуры есть; полнота vs план энтайтлментов — отдельно. |
| 7 | Worker day | **PARTIAL** | API `worker/day/start`, `end`; мобильная приёмка — NEEDS_LIVE_VERIFICATION. |
| 8 | Reports | **PARTIAL** | Web + API + ревью; согласованность статусов (`rejected` / `reviewed`) — см. внутренние блокеры. |
| 9 | Media/upload sessions | **PARTIAL** | Маршруты upload-sessions/finalize, тесты; iOS JPEG-путь; видео в Worker — gap относительно части бизнес-ожиданий (см. launch docs). |
| 10 | Sync | **PARTIAL** | `sync/bootstrap`, `changes`, `ack` + тесты; конфликты — runbook `docs/runbooks/MOBILE_SYNC.md`. |
| 11 | iOS Worker | **PARTIAL** | Основной контур; нет `.xcodeproj` в снимке репо — **NEEDS_LIVE_VERIFICATION** + инженерный риск. |
| 12 | iOS Manager | **PARTIAL** | Отчёты, ревью, часть AI/вкладок — placeholders; паритет с вебом не полный. |
| 13 | Android Worker | **PARTIAL** | ViewModel + API **есть**; UI **не подключён** — фактически **OPEN** для пользовательского продукта, **PARTIAL** для backend-интеграции. |
| 14 | Android Manager | **PARTIAL** | Реальные экраны и API; углублённый аудит уведомлений/всех вкладок — OPEN/VERIFY. |
| 15 | AI Vision | **PARTIAL** | `analyze-image`, нормализация, fallback-тесты; полнота evidence/confidence в UI — VERIFY. |
| 16 | Copilot | **PARTIAL** | Stream route, контекст, часть интеграции; «полный RAG» из ТЗ §6.6 — **OPEN**. |
| 17 | Intelligence | **PARTIAL** | Маршруты intelligence/insights, ai-brain; live качество сигналов — NEEDS_LIVE_VERIFICATION. |
| 18 | Manager Actions | **PARTIAL** | Код и unit-тесты (`test:manager-layer`); покрытие всех сценариев ТЗ §6.8 — VERIFY. |
| 19 | Schedule/Milestones | **PARTIAL** | Миграции и API milestones; dashboard overdue/at-risk — VERIFY end-to-end. |
| 20 | Approvals | **PARTIAL** | Отчёты + документы + история; семантика статусов — довести до FULL по ТЗ §6.10. |
| 21 | Documents | **PARTIAL** | Модель/API/UI частично; E2E «create→upload→link→review→approve» из ТЗ §6.11 — **OPEN** до доказательства. |
| 22 | Budget/Costs | **PARTIAL** | `project_cost_items`, API costs; **live** активация и сигналы в intelligence — NEEDS_LIVE_VERIFICATION (ТЗ §6.12). |
| 23 | Brand/Design System | **PARTIAL** | Токены в `lib/design/`; буквальный список PNG в ТЗ §9 — частичное совпадение с `public/brand` (SVG). |
| 24 | Release workflows | **PARTIAL** | Staging с env-check и blocking pilot-smoke; prod — смотреть workflow; не всё из §8.1 в `ci-check`. |
| 25 | Smoke gates | **PARTIAL** | Staging: blocking `pilot-smoke` после deploy; PR: нет обязательного post-deploy smoke (ожидаемо). |
| 26 | Env/config gates | **PARTIAL** | `lib/config`, `scripts/release/check-env-config.sh` на staging; полный «env inventory» как в ТЗ — уточнять список артефактов. |
| 27 | Observability/system routes | **PARTIAL** | Health, ops, diagnostics, admin; централизованный «операторский дашборд» из Phase 8 ТЗ — **OPEN**. |
| 28 | Billing/admin | **PARTIAL** | Много admin/billing маршрутов, pilot cohorts; enterprise hardening — OPEN. |
| 29 | Customer portal | **PARTIAL** | API client-portal, stakeholders, client-view и др.; MVP §6.13 ТЗ — **OPEN** как завершённый продукт. |
| 30 | Tests/build/deploy | **PARTIAL** | Vitest, часть E2E Playwright, `cf:build` в CI; нет явного `typecheck` скрипта; мобильный CI не на каждый PR. |

---

## Сводка по статусам

| Статус | Кол-во областей (из 30) |
|--------|-------------------------|
| FULL | 0 |
| PARTIAL | 28 |
| OPEN (включая подпункты в обосновании) | см. Documents, Copilot RAG, Observability enterprise, Customer MVP |
| BROKEN | 0 (не подтверждено без прогона CI локально) |
| STALE_DOCS | отдельно: старые пути в части `docs/status/*` |

---

## Конфликты источников требований

1. **`AISTROYKA_TZ.md` §6.4** — Android не считать продуктом, parity запрещён до milestone.  
2. **`docs/launch/FIRST_CLIENT_SCOPE_LOCK.md`** — Android обязателен для программы первого клиента.

**Рекомендация:** зафиксировать **один приоритетный контракт** на уровне продукта и обновить второй документ или добавить явную оговорку «какая программа активна».

---

## Следующий шаг по ТЗ

Phase 1 — **Build/Release Truth**: прогон `bun run lint`, `bun run test`, `bun run cf:build` из корня, фиксация в `docs/tz/01_BUILD_RELEASE_TRUTH_REPORT.md`.
