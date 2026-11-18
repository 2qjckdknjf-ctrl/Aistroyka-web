# Render vs Architecture Audit — Cabinet Canon (screens 01–10)

**Date:** 2026-08-25  
**Branch:** `design/canon-cabinet-full-2026-08-25`  
**Canon evidence:** `docs/design-system/memory-os-canon-evidence/AISTROYKA_FINAL_RENDERS_*.jpg`

## Executive summary

Рендеры описывают **единый операционный кабинет** (contractor/manager): широкий sidebar с текстом, верхний search bar с ⌘K, footer со статусом, богатые таблицы/KPI/AI-панели. Текущий код на `origin/main` — **узкий icon-rail (72px)**, упрощённый header (email + locale), onboarding/AI guide на каждой странице, карточная сетка проектов вместо таблицы каталога.

**Стратегия:** design-first — shell + screen layouts с реальными данными где API есть; визуальные блоки без бэкенда — статичные demo-слоты с явной маркировкой до F1/F2 wiring.

## Screen map (10 renders)

| # | Render | Target route | Current | Gap |
|---|--------|--------------|---------|-----|
| 01 | Главный дашборд | `/dashboard` | `DashboardCanonHome` cards | KPI row, projects **table**, attention, activity, AI+weather |
| 02 | Проекты (каталог) | `/dashboard/projects` | Card grid | **Table** + filters + right AI portfolio panel |
| 03 | Командный центр | `/dashboard/projects/[id]` | Tabs exist | KPI strip, milestones, photo, team, cost chart |
| 04 | Задачи (Kanban) | `/dashboard/tasks` | List/kanban partial | Kanban columns + AI priorities rail |
| 05 | Проверка отчёта | `/dashboard/reports/[id]` | Basic report | Workflow steps, before/after, decision cards |
| 06 | Документы | project `?tab=documents` | Table + modal | Folder tree, preview pane, upload bar |
| 07 | График и этапы | project schedule tab | Partial | Gantt, milestone panel, AI forecast |
| 08 | Команда и подрядчики | `/dashboard/workers` | Simple list | Dual tables + 4 bottom widgets |
| 09 | AI-риски | `/dashboard/ai` | Basic AI page | Charts, heatmap, recommendations column |
| 10 | Owner portal | `/portal/*` | Contractor shell | **Separate** client shell (V4.1 IA) |

## Shell architecture (render vs code)

| Block | Render | Current `DashboardShell` | Slice |
|-------|--------|------------------------|-------|
| Sidebar width | ~240px, icon + label | 72px icon rail | **D1-C shell** |
| Sidebar items | 11 nav + AI card + collapse | 9 icons + “more” dropdown | D1-C |
| Top bar | Center search ⌘K, bell, chat, profile | Date range + small search + email | D1-C |
| Footer | Date, week, status, feedback | Build stamp only | D1-C |
| Onboarding | Absent on renders | `FirstLaunchGuide` every page | D0.3 hide in canon |
| Page chrome | Title + star + filters + gold CTA | Per-page ad hoc | Shared `CanonPageHeader` |

## Nav IA (render → existing route)

| Render label | Route (existing) | Notes |
|--------------|------------------|-------|
| Главный дашборд | `/dashboard` | OK |
| Проекты | `/dashboard/projects` | OK |
| Задачи | `/dashboard/tasks` | Badge from open tasks API later |
| Календарь | `/dashboard/workload` | Placeholder until calendar route |
| Документы | `/dashboard/uploads` | OK |
| Финансы | `/dashboard/reports` | Commercial reports surface |
| Поставки | `/dashboard/devices` | Placeholder — no supplies module |
| Подрядчики | `/dashboard/contractors` | Team page uses `/dashboard/workers` |
| Отчёты | `/dashboard/reports` | Same as finance in render — split tabs in UI |
| Риски | `/dashboard/ai` | AI risks screen |
| Настройки | `/dashboard/settings/auth` | OK |

## Non-breaking implementation order

1. **Shell** — CSS tokens, sidebar/top/footer, hide legacy onboarding in `[data-canon-cabinet]`
2. **Screens 01–02** — home + projects catalog (this slice)
3. **Shared primitives** — KPI card, data table, badge, AI panel shell
4. **Screens 03–09** — per-route canon components (no route deletion)
5. **Portal 10** — separate shell (`portalOnly`)
6. **F1 wiring** — orphan panels, file picker, forms (after visual acceptance)

## Validation (slice shell + 01–02)

- `bun run --cwd apps/web eslint app components lib middleware.ts`
- `bun run i18n:check`
- Visual: desktop 1440px vs render JPGs

**Verdict:** IN PROGRESS
