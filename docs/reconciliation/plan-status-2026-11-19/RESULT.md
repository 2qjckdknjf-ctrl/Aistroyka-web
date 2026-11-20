# Сверка планов разработки с текущим статусом — 2026-11-19

**Tip `main`:** `b736b6cffc7d572eeeed571fe8a4ed04ac1e38de` (`b736b6c`)  
**Live:** staging + production `buildStamp.sha7 = b736b6c`, health `ok/db/supabaseReachable = true` (проверено 2026-11-19 ~15:18 и повторно ~17:45 Europe/Madrid).  
**Источники планов:** mega-roadmap очередь 2026-10-23, Phase 13 closure, `CURRENT_EXECUTION_STATE_2026-10-11`, `STATUS.md`, `CURRENT_PROJECT_TRUTH_INDEX.md`, аудит `AUDIT_2026-11-18`, `ACTIVE_WORK_REGISTRY.csv`.

## 1. Вердикт

| Контур | Вердикт |
|---|---|
| Phase 13 product scope | **CONDITIONAL YES** (2026-06-16) — отдельной Phase 14 нет |
| Очередь AIS Oct-23 (код) | Большая часть conveyor Oct-28/`#480–#483` **уже в main**; таблица «#446–#453 PR_ONLY» в mega-roadmap **устарела** |
| Аудит Nov-18 P0/P1 agent-фиксы | **DONE** — #489–#499 merged + deployed `b736b6c` |
| Runtime | **RECOVERED** — Supabase снова доступен; GDPR schedule SUCCESS |
| Что остаётся продуктово | Evidence/Graph lineage, V2 ledger, Manager/recon polish — agent; legal/store/billing 7-day/device — **OWNER_GATE** |

## 2. План аудита §12 → факт

| # | Пункт | Статус |
|---|---|---|
| 1 | Восстановить Supabase | **DONE** (владелец) |
| 2 | Алерты + smoke 503=FAIL | **DONE** (#493, #497) |
| 3 | Next 15.5.29 | **DONE** (#492) |
| 4 | Закрыть `/smoke` | **DONE** (#490) |
| 5 | Stakeholder fail-closed | **DONE** (#491) |
| 6 | Legal Privacy/Terms | **OWNER_GATE** |
| 7 | Docs account-billing truth | **DONE** (#496) |
| 8 | STATUS / Truth Index после БД | **DONE** (этот срез + #501) |
| 9 | Route-тесты privileged API | **PARTIAL** (#498 + продолжение) |
| 10 | Semantic review 74 PR / ветки | **OPEN** (owner-gated archival) |
| 11 | Vision review UI / Graph invalidate-on-revoke | **PARTIAL** — completeness Manager UI уже на main; Graph invalidate-on-revoke **ещё нет** как явного модуля |
| 12 | Store / device / live AI fixtures | **OWNER_GATE** |

## 3. Mega-roadmap очередь — устаревшие утверждения (исправлены в этом PR)

Было (текст 2026-10-23): main `04ec74b`; #446/#447/#448/#449/#453 «не merged / PR_ONLY».  
Факт: эти PR **MERGED** 2026-10-28+; tip `b736b6c` включает audit Nov-19. В шапку очереди добавлен блок «Сверка 2026-11-19».

## 4. Registry

`ACTIVE_WORK_REGISTRY.csv`: 132 строки; доминирует `RECONCILE_BACKLOG` (60) и `VALIDATION_EVIDENCE` (14). Это не активный execution backlog — semantic reconciliation старых PR. Не раздувать scope: вести через dry-run archival policy, не массовый merge.

## 5. Открытый execution backlog (после сверки)

### Agent-doable (следующее)

1. **AIS-GRAPH-004:** ~~явного пути не было~~ → **в этом PR:** `invalidateConstructionGraphForSource` + вызов из `reviewAiAnalysis` при снятии Graph eligibility.  
2. **Route coverage:** ~~`billing/overview` / `help/hints` без тестов~~ → **в этом PR** colocated 401/deny + hints happy-path; остаток `platform/*` / `admin/*` / прочие billing — дальше.  
3. **i18n P2:** ~~DemoProjectCard hardcoded EN~~ → **в этом PR** en/ru/es/it; platform-admin/operator surfaces — дальше.  
4. **V2-WEB-01:** первый bug slice после fresh repro (не открывать 97 пакетов сразу).  
5. **Docs:** STATUS/Truth Index/очередь синхронизированы в этом PR.
### OWNER_GATE

- Legal Privacy/Terms  
- TestFlight / Play uploads + device smoke  
- Billing 7-day zero-drift / account entitlement cutover  
- Live Gemini/Worker fixtures  
- Named owners для M0 V2 packages  
- `#178` — **не мержить as-is** (устаревший June audit); Russian default уже в AGENTS

## 6. Что сознательно не делается в этом срезе

- Не создаём второй mega-backlog из V2-97.  
- Не трогаем Stripe/entitlement cutover.  
- Не archive remote branches без dry-run + owner approval.  
- Не фейкаем store/AI LIVE без evidence.
