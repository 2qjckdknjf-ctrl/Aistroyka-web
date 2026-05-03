# Открытые блокеры и риски (Phase 0)

**Дата:** 2026-04-27  
**Классификация:** P0 — блокирует заявленную поставку / безопасность; P1 — высокий риск до pilot/production; P2 — документировать, планировать.

---

## P0 — критично (требует решения или явного waiver)

| ID | Блокер | Доказательство / контекст | Что сделать |
|----|--------|---------------------------|-------------|
| P0-DOC-1 | **Конфликт требований: Android** | `AISTROYKA_TZ.md` §4.1 / §6.4 — Android deferred/foundation; `docs/launch/FIRST_CLIENT_SCOPE_LOCK.md` — Android обязателен для первого клиента | Продуктовое решение: какой документ главный для текущей поставки; обновить второй источник |
| P0-UX-1 | **Android Worker не является пользовательским продуктом** | `WorkerApp.kt` — заглушка; `MainActivity` не использует `WorkerViewModel` | Подключить UI к ViewModel (минимальный MVP) или зафиксировать waiver по активной программе |
| P0-REL-1 | **Воспроизводимость iOS в репо** | В снимке workspace **нет** `*.xcodeproj` | Уточнить: репозиторий неполный, проект в другом месте, или `.gitignore`; иначе CI/релиз iOS непрозрачны |

---

## P1 — высокий риск

| ID | Риск | Контекст | Что сделать |
|----|------|----------|-------------|
| P1-API-1 | **Единый response envelope** на всех `/api/v1` | ТЗ §4.2 требует единообразие | Инвентаризация маршрутов + политика + постепенное выравнивание |
| P1-API-2 | **Валидация всех mutating routes** | ТЗ §4.2, Phase 2 | Сканирование POST/PATCH/DELETE и чек-лист Zod/аналог |
| P1-SEM-1 | **Семантика ревью отчётов** | Внутренний blocker register: `rejected` vs `reviewed` | Сверить миграции, API, iOS Manager, web dashboard |
| P1-DOC-1 | **Documents E2E** | ТЗ §6.11 — manager workflow end-to-end | Сценарий приёмки + E2E или ручной прогон с записью |
| P1-COST-1 | **Budget/costs live** | ТЗ §6.12 — target DB + manager UI | Проверка миграций на staging/prod + smoke маршрутов |
| P1-SEC-1 | **RLS / service role** | Исторические аудиты (permissive policies, service role в Edge) | Переаудит по **текущим** файлам в `apps/web/supabase/migrations/` и Edge/web call sites |
| P1-CI-1 | **Явный typecheck в gate** | ТЗ §8.1 перечисляет typecheck; в `apps/web/package.json` нет отдельного скрипта | Добавить `tsc --noEmit` или эквивалент в CI при необходимости |
| P1-MOB-1 | **Мобильный CI на каждый PR** | `ci-check.yml` — только web; Android smoke — `workflow_dispatch` | Решить минимальный gate (хотя бы assemble) приоритетом программы |

---

## P2 — не блокирует немедленно, но техдолг

| ID | Тема | Примечание |
|----|------|------------|
| P2-DOC-1 | **Устаревшие пути в `TECHNICAL_DOSSIER.md`** | Указан `engine/Aistroyk/...` vs фактические миграции в `apps/web/supabase/migrations/` |
| P2-BRD-1 | **Бренд-ассеты: PNG из ТЗ §9** | В репо преобладают SVG в `public/brand/` — несовпадение с буквальным списком файлов |
| P2-IOS-1 | **Заголовок `x-client: ios_lite`** | Наследие имени; функционально приемлемо, если сервер поддерживает |
| P2-PLT-1 | **Platform Owner кабинет vs ТЗ §5.1** | Есть доступ, audit/grants, часть API; нет полноценных экранов метрик/tenants/billing/support |
| P2-COP-1 | **«Полный RAG» из ТЗ §6.6** | Сознательно позже по дорожной карте ТЗ (Phase 6) |

---

## Внешние / средовые блокеры (не код)

| Тема | Комментарий |
|------|-------------|
| Секреты и ключи | Секреты не в репо; smoke/deploy зависят от GitHub Secrets и Supabase — без них Phase 1 live-часть не воспроизводима в агенте |
| Целевая БД | Миграции в репо ≠ автоматически применены на конкретном проекте Supabase |

---

## Статус реестра

| Вопрос | Ответ |
|--------|--------|
| Phase 1 (build/release truth) | **PARTIAL закрыт** — см. **`docs/tz/01_BUILD_RELEASE_TRUTH_REPORT.md`**: `bun run lint`, `bun run test`, `bun run cf:build` прошли; `release-readiness-check` / `validate-release-env` локально **FAIL** без `SUPABASE_SERVICE_ROLE_KEY` (и др.) — не дефект кода. |
| Phase 2–6 отчёты | **Созданы** — см. **`docs/tz/README.md`** (`02`…`06` + post-audit где требовалось ТЗ); Phase 7–8 — **заготовки** (`07`, `08`). |
| Phase 2 (API contract) | **PARTIAL** — отчёт **`02_*`**; envelope/OpenAPI — бэклог. |
| Phase 3–6 | Отчёты **`03_*`–`06_*`** (+ post-audit для 4–6); live-приёмка там, где указано NEEDS_LIVE_VERIFICATION. |
| Phase 7–8 | Только **заготовки** `07_*`, `08_*` до старта программы. |
| Пуст ли P0 для «production-ready по всему ТЗ §13»? | **NO** — Android Worker UX, конфликт программ по Android, прозрачность iOS-проекта |
| Нужно ли обновлять этот файл после Phase 2+? | **YES** — перенос закрытых пунктов и новых находок |
