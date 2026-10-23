# AISTROYKA — UPDATED MEGA ROADMAP FOR CURSOR
Version: 2026-10-23 (active queue; original Phase 0–13 preserved)
Status: UPDATED WITH CUSTOMER FINANCE ISOLATION RULE
Purpose: Deep sequential product/engineering plan to finish AISTROYKA as a production-ready AI construction management platform.

## Действующая очередь — консолидация 2026-10-23

Эта очередь задаёт текущие приоритеты внутри существующих Phase 0–13 и AIS ID. Полные критерии фаз, [amendment](AISTROYKA_PLAN_AMENDMENT_2026-09-23.md) и [97 пакетов V2](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) сохраняются; не создавать второй backlog из ежедневных новостей. **Ответственные ниже — роли; конкретный исполнитель и независимый reviewer: TBD, назначаются до старта среза.** Вехи являются gates, а не обещанными календарными датами.

Срез GitHub: main `04ec74bf955c29799ab535c043a33c1f9296c309`; этот документ продолжает **необъединённый Draft #453** на `586649ea9774924eb75512aa26d861974d372589`. Свежий remote preflight на main: `CURRENT_BASELINE`. Код/тесты/readiness и production проверяются раздельно; 23 октября live/device/provider проверки не запускались. Точные PR/HEAD/base/checks: [машинный снимок](CONSOLIDATION_EVIDENCE_2026-10-23.json).

### Реализованное и открытая работа

| Область | Подтверждённый уровень | Оставшийся gate |
|---|---|---|
| Customer iOS/portal/gallery, ручной intake, report publication | CODE_PRESENT в main; historical deployed/device evidence описан в [план/факт](CURRENT_EXECUTION_STATE_2026-10-11.md) | Полный актуальный UX/device/role/revoke сценарий; не создавать приложения и CRUD повторно |
| Async image analysis, request_key; Construction Graph repository/overlay | CODE_PRESENT и тестовые файлы в main; image job имеет historical live proof | Report-media handler `apps/web/lib/platform/jobs/job.handlers/ai-analyze-media.ts` вызывает `analyzeImage`, но не сохраняет его результат; полное video→review→Graph ещё PARTIAL |
| Security fixes #446/#447 | PR_ONLY, оба OPEN DRAFT; observed required check SUCCESS | #446 exact attachment/project/source enforcement; #447 private helper grants. #447 hosted DDL не доказан. До runtime closure нужен отдельный approved rollout/receipts |
| Exact quantity/commercial core #448→#449 | PR_ONLY, bounded pure core; #448 observed check SUCCESS; #449 main-only required CI не запускался | Storage/evidence/spec bindings, UI, professional confirmation и independent C05 gold acceptance не закрыты |
| #453 полный V2 audit | PR_ONLY / docs-only, 97 proposed packages; 406 AC, 243 planned checks | Ни один пакет автоматически не completed. Frozen JSON/97 mappings сохранять; актуальный acceptance ledger обновлять отдельно |
| Workflow supply chain | PARTIAL: часть actions закреплена SHA, `ci-check.yml` и другие workflows ещё используют tags | Инвентаризация всех third-party actions, immutable SHA, least privilege, dependency provenance и tested exception path |

### Один ID на одно требование

| ID / scope | Приоритет; состояние; ответственный | Зависимости / веха | Критерии приёмки следующего среза |
|---|---|---|---|
| AIS-PILOT-001, Phase 0/13 | P0; PARTIAL/PR_ONLY; security + release lead | M0 → M1 | Сверить #446/#447 и текущие код/PR/receipts; foreign tenant/project, revoked role, source substitution и direct-RPC negatives отвергаются; exact candidate SHA, independent verdict и rollback/disable. Action pins/egress policy проверены; monitor/approval configs нельзя изменять обычной задачей агента. |
| AIS-OWNER-001/002, AIS-APPROVAL-003; Phase 2–5/9 | P0 для access/approval, P1 UX; PARTIAL; backend + iOS lead | M1, отдельный Customer release gate | Продолжить существующие targets/portal: опубликованная версия → разрешённый viewer; revoke закрывает API/media/export/AI context. Внутренние costs/margin не попадают в customer projection. Approval привязан к actor/project/action/version/digest/expiry; change/replay/role revoke требует нового согласия. |
| AIS-EVID-002 / AIS-VISION-003; V2-CON-03 + V2-ARCH-05; Phase 6/7 | P1, P0 до признания AI-результата доказательством; PARTIAL; media/AI backend lead | #446 scope gate → M2 | Один canonical durable result на source revision/job/lease; media-id и upload-session-only путь явно покрыты, retry/crash/lease loss не дублируют результат. Video segment/frame/timecode → observation → human verdict; missing/blur/stale/conflict дают INSUFFICIENT_EVIDENCE, не PASS. Ошибка/cancel оставляют восстановимый draft, current ACL проверяется при чтении. |
| AIS-GRAPH-004 / AIS-SPATIAL-011 | P1; PARTIAL; domain backend lead | M2 → M3 | Reuse existing repository/overlay: room/element/work/material/source revision, coordinate units/calibration либо unresolved. Replay идемпотентен; corrected/deleted/revoked source инвалидирует edges/cache/status. Нет вывода «работа завершена» из отсутствующего покрытия. Customer/Worker/Supply projections до LLM. |
| AIS-CORRECTION-009 / AIS-RULE-015 | P1; PLANNED/PARTIAL; construction QA + evaluation lead | M2 → M3; P0 до количественного sign-off | Versioned original prediction + accepted/edited/rejected correction + reviewer/reason/provenance. Один trade completeness template с source/version; отсутствующие измерения/документы → question/ABSTAIN. Site-level frozen holdout и независимый специалист; все attempted costs, false acceptance, review rate. Training consent отдельно. |
| AIS-MEM-016 / AIS-STREAM-010 | P1; PLANNED/PARTIAL; retrieval/media lead | M2/M3 | Timecoded semantic video search по разрешённым segments, captions, source links; transcript partial/final/clock uncertainty сохранены. Benchmark lexical/hybrid baseline: source accuracy, recall, latency p50/p95, all-attempt cost per verified finding. Revoke/delete/source revision инвалидирует index/cache; originals вне неразрешённого context. |
| AIS-MATERIAL-008 — read/draft slice | P1 для bounded specification/evaluation, P2 расширение после pilot; PLANNED; materials/domain lead | M3 + confirmed quantities; reuse #448→#449 core | Requirement/work package → confirmed quantity/unit/spec → dated supplier source → draft comparison. SKU/package/coverage, region/currency/IVA/shipping, stock/lead-time/quote expiry и provenance явны; unknown не «в наличии». Search & Fetch сравнить с existing/API/manual baseline. Без second calculator, заказа, оплаты или сообщения поставщику. |
| AIS-MATERIAL-008 — purchasing/continuous observer | P2; LATER; procurement owner | M4 + отдельный approved scope; ROMA authority/broker/audit | Budget/TTL/backoff/pause/revoke; changed quantity/supplier/quote/schedule делает approval stale. Exact basket/account/amount approval и idempotency/reconciliation обязательны. Read-only research не разрешает purchase, payment или communication. |
| AIS-CLIENT-005A | P1; manual foundation CODE_PRESENT, extractor PLANNED; product/backend lead | M2/M3 + Owner contracts | Existing owner-bound intake → source-linked rooms/work suggestions → human edit/reject/confirm. Repeated confirmation и draft-ID promotion не дублируют entities; без автоматических contracts/estimates/assignments. |
| AIS-CLIENT-005B | P2; PLANNED; mobile/media lead | 005A + M3 + Owner readiness | Camera/voice consent, deny/stop/cancel/reconnect, ephemeral scoped sessions, server credentials, budgets; async fallback. No autonomous construction sign-off. Feature off до separate evaluation/release gate. |
| AIS-SPATIAL-PROVIDER-012 / AIS-OWNER-3D-013 | P2; PLANNED; spatial/frontend lead | M3/M4 + calibrated source | Sandbox import/parametric geometry на known measured fixtures; source/revision/units/uncertainty. 3D read-only projection existing Graph; accessible 2D/list fallback, device performance and evidence links. SolidCraft/vendor не утверждён; без нового CAD/BIM editor. |
| AIS-RECON-017 / AIS-MATCH-006 | P2; PLANNED; commercial/product lead | M3/M4 + confirmed scope | Reconciliation существующего tender/quantity/source, versioned delta и professional approval; matching только по sourced competency/capacity, объяснимый human choice. Directory не считать готовым marketplace. |
| Остальные Phase 0–13 + V2-97 | Existing priority; PROPOSED/PARTIAL; соответствующий domain lead | Полный [V2 DAG](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) | Не удалять manual core, public, billing, a11y/localization/recovery задачи. Первый независимый bug slice V2-WEB-01 после fresh repro; shared CON/ARCH реализуется одним owner. iOS primary; Android D2 DEFERRED_BY_DECISION. |

### Вехи и безопасный порядок

1. **M0 — reconcile:** назначить owner/reviewer, exact source/base/PR, baseline/AC и write-set. Review #453 full audit; эта консолидация добавляет приоритеты и не заменяет 97 карточек. Закрыть planning overlap до реализации; старые source snapshots не переписывать.
2. **M1 — boundary:** #446/#447 security findings + source/role/approval/runtime-audit gap closure; локальные негативные fixtures, required CI и независимое review. Remote migration/merge/deploy — только отдельное подтверждение пользователя. Небольшие независимые core/UI fixes не ждут полной AI/Customer программы.
3. **M2 — evidence:** durable report media → reviewed video observations → exact source lineage и negative access/retry/cancel suite. Definition of done — сохранённый/read-back reviewed result, не job toast.
4. **M3 — usable evidence:** Graph/corrections → timecoded retrieval + один completeness template + confirmed quantities → read/draft materials pilot. Model/Decisions API или иной router candidate только через Grow benchmark; сравнить no-LLM/current baseline, abstention и cost per verified task. Результат классификатора не разрешение действия.
5. **M4 — controlled expansion:** отдельные Customer/async intake, spatial/3D, live intake/matching и supplier extensions при собственных gates. Contractor-ops-only pilot, customer-finance isolation, physical-device/store/legal и billing 7-day zero-drift не отменяются.

### Сведение AI Scout и обзоров без дублирования

| Источник | Куда сведён / решение |
|---|---|
| [#450 / 15 октября](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/450), HEAD `903314a` | Actions provenance → AIS-PILOT-001; worker/approval → OWNER/APPROVAL; completeness/Graph → EVID/VISION/GRAPH; scene benchmark → SPATIAL. Отдельные daily tasks не нужны. |
| [#451 / 18 октября](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/451), HEAD `45365ed` | Supplier search → MATERIAL read/draft; CAD → SPATIAL-PROVIDER P2; purchase/sign-off → APPROVAL. Trading text не импортируется в AISTROYKA scope. |
| [#452 / 20 октября](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/452), HEAD `d6b6558` | Timecoded search → MEM/STREAM/VISION; document/visual provenance → GRAPH/EVID; purchasing boundaries → MATERIAL/APPROVAL. |
| Обзоры до 13 октября | [Existing reconciliation](AI_DIGEST_RECONCILIATION_2026-10-13.md) остаётся source mapping; нынешняя очередь заменяет его старые priority/state snapshots. |
| Обзоры 21–23 октября из [исходного чата](https://chatgpt.com/c/6ac9d8f6-bca8-83ed-a870-d505bf1c9c69) | Независимый monitor, audit completeness, Dynamic Agent Authority, Credential Broker и finding lifecycle — shared ROMA dependencies в [ROMA plan](../roma/ROMA_EXECUTION_ASSURANCE_PLAN_2026-09-23.md); локальные source/tenant gates сохраняются. Supervisor/routing/cost/skill metrics — Grow. Package policy → PILOT; edge accelerator → bounded P2 capture benchmark. Метрики use/skill/MCP не доказывают качество. |

Первоначально все три Scout PR проверены как OPEN DRAFT; этот snapshot сохранён. После проверки опубликованных замен #450/#451/#452 **закрыты без merge 2026-10-23 как superseded** этой продуктовой консолидацией [#455](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/455) и [ROMA #454](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/454). Исходные ветки/HEAD и история сохранены и проверены; closure receipts добавлены в JSON evidence. Рекомендации семантически сведены в таблицу, daily addenda не переносить снова в активный backlog. #453 не superseded: это полный обязательный audit package, на котором построена эта ветка. Совместная интеграция требует сохранить обе части.

Проверенные primary sources для планирования: [METR red-team](https://metr.org/blog/2026-10-22-red-teaming-openai-agent-monitoring/) → independent monitoring/coverage tests; [Decisions API](https://openai.com/index/decisions-api/) → bounded benchmark candidate; [1Password for Agents](https://1password.com/blog/1password-for-ai-agents) → optional broker adapter; [Claude Security](https://claude.com/resources/articles/claude-security-now-scans-continuously-and-tracks-fixes) → finding lifecycle reference. [Package Firewall](https://github.blog/changelog/2026-10-20-github-package-firewall-in-public-preview/) — Enterprise Cloud/npm preview, account eligibility unknown; existing pinning/provenance/install controls остаются fallback. [NVIDIA media search](https://blogs.nvidia.com/blog/media-agentic-security-european-public-service-broadcasting-global-content-production/) — timecode-search reference, не доказательство точности строительных измерений.

Coverage: текст обзоров 21–23 октября доступен ограниченными prefixes, часть action-ответов opaque. Не утверждаем, что прочитаны недоступные окончания; использованы actual Scout diffs, retrieved text, primary checks и явные приоритеты пользователя.

Названия/даты релизов, цены и vendor benchmarks в обзорах — research inputs, не доказанные зависимости. Перед vendor spike нужны primary documentation, API/account access, privacy/retention/license и cost; нельзя автоматически сменить provider, включить paid calls или расширить полномочия. Наличие incident story не доказывает компрометацию этого проекта.

### Нерешённые блокировки

- #446/#447/#448/#449 и #453 не merged; #449 требуется applicable CI после reconciliation с target base. Приоритет не отменяет независимое review.
- Durable report-media result, full video/human-review/Graph lineage и independent C03/C05 acceptance не завершены.
- Current live SHA, применённые новые миграции, physical device, store/legal и billing temporal gates этим проходом не подтверждались; historic PASS нельзя переносить на новый HEAD.
- Named owners/reviewers, consented corpus/measurement gold set, supplier source/availability access и measured acceptance thresholds требуют назначения/фиксации перед pilot.
- ROMA runtime enforcement и Grow integration принимаются только с их собственным evidence; схема/документ не implementation. Older mixed PR semantic reconciliation продолжается; полный diff всех исторических веток этим срезом не сертифицирован.

---

# 0. CORE PRODUCT POSITIONING

AISTROYKA must become:

> AI-powered construction trust and control platform:
> evidence + schedule + documents + approvals + customer decisions + estimates/change approvals + AI daily control.

The project must not become a generic project-management clone.
Its strongest market position is construction-specific operational truth.

## Main user groups

1. Construction company owner / director
2. Project manager / foreman
3. Worker / subcontractor
4. Customer / property owner
5. Platform operator / admin

## Main business promise

AISTROYKA helps construction companies prove work, control risks, avoid disputes, manage documents, manage customer approvals, and keep customers informed without exposing internal company finances.

---

# 1. CRITICAL PRODUCT RULE — CUSTOMER FINANCE ISOLATION

This rule is mandatory across the whole project.

## 1.1 Customer must NOT see internal financial state

The customer / property owner must never see:

- internal project margin
- internal budget pressure
- company profitability
- internal planned vs actual costs
- contractor labor cost
- subcontractor purchase prices
- internal cost overruns
- internal cost item list
- internal estimates vs real expense delta
- internal financial health score
- company cashflow
- internal AI finance risk
- manager-only cost analytics

## 1.2 Customer CAN see only commercial-facing financial documents/requests

The customer can see:

- estimate sent for approval
- additional estimate / допсмета
- change order price that requires approval
- payment schedule if intentionally customer-facing
- invoice / act / contract if intentionally shared
- approved amount for a specific customer decision
- rejected / pending estimate decisions
- history of customer-approved commercial changes

## 1.3 Correct language

Use different product language for internal and customer-facing finance.

### Internal manager language

Use:

- cost control
- budget pressure
- actual cost
- planned cost
- overrun
- margin risk
- cost item
- internal budget
- profitability
- financial risk

### Customer-facing language

Use:

- estimate
- proposal
- additional work
- approval required
- approved amount
- rejected proposal
- pending estimate
- payment schedule
- commercial document
- agreed price

## 1.4 Architecture rule

Internal tables/services can store detailed cost data.
Customer APIs must expose only explicit customer-facing projections.

Preferred separation:

- `project_cost_items` — internal only
- `estimates` / `customer_estimates` — customer-facing
- `change_orders` — customer-facing if sent for approval
- `decision_requests` — customer-facing approval wrapper
- `documents` — customer-facing only when visibility flag permits

## 1.5 API rule

Never reuse manager cost routes for owner/customer.

Forbidden for owner/customer:

```text
GET /api/v1/projects/:id/costs
GET /api/v1/projects/:id/costs/*
GET /api/v1/projects/:id/internal-budget
GET /api/v1/projects/:id/cost-summary
```

Allowed owner/customer equivalents:

```text
GET /api/v1/owner/projects/:id/estimates
GET /api/v1/owner/projects/:id/change-orders
GET /api/v1/owner/projects/:id/decisions
GET /api/v1/owner/projects/:id/commercial-documents
```

## 1.6 UI rule

Owner Portal must not contain:

- Costs tab
- Budget tab
- Internal finance tab
- Margin/risk/cost-overrun cards
- Internal cost analytics

Owner Portal may contain:

- Estimates to approve
- Additional work proposals
- Approved commercial changes
- Payment milestones if explicitly configured
- Documents shared with customer

---

# 2. NON-NEGOTIABLE EXECUTION RULES FOR CURSOR

## 2.1 Work sequentially

Do not skip stages.
Do not open a new product layer while the current one has meaningful unfinished work.

## 2.2 Every stage must end with verification

For each stage produce:

- implementation summary
- tests/build results
- changed files list
- risk list
- open issues
- final YES/NO closure verdict

## 2.3 No fake completeness

Never mark a step closed if:

- code is implemented but not wired into UI
- UI exists but API is fake
- API exists but DB migration is unapplied
- local tests pass but live/runtime is unverified where required
- access control is not tested
- tenant/project boundaries are not verified
- customer finance isolation is not tested

## 2.4 Mandatory validation

At minimum after every major stage:

```bash
bun run lint
bun run test
bun run build
bun run cf:build
```

If specific route/domain tests exist, run them too.

## 2.5 Security rules

- Never commit secrets.
- Never print raw secrets.
- Preserve tenant isolation.
- Preserve role boundaries.
- Owner/customer views must not leak internal admin/operator data.
- Owner/customer views must not leak internal financial state.
- Share links must be scoped and tokenized.

---

# 3. CURRENT BASELINE FROM REPO

AISTROYKA is already a substantial monorepo:

- `apps/web` — main Next.js / OpenNext / Cloudflare Workers app
- `packages/contracts` — shared Zod contracts
- `ios/` and `android/` — mobile surfaces
- versioned public API under `/api/v1/*`
- Cloudflare staging/production deploy workflows
- pilot smoke workflows
- Supabase migrations and RLS foundations

The current product already includes core project tabs for:

- workers
- contractors
- reports
- uploads
- AI
- intelligence
- schedule
- documents
- costs
- estimate

This roadmap assumes these foundations exist and must be hardened, connected, and productized.

---

# 4. MASTER SEQUENCE

| Order | Phase | Goal |
|---:|---|---|
| 0 | Live Truth Verification | Prove repo, production, staging and Supabase are aligned |
| 1 | Manager Daily Control Center | One screen showing what needs action today |
| 2 | Owner / Customer Portal | Customer-facing transparency without internal finance leakage |
| 3 | Decision Requests | Formalize customer decisions |
| 4 | Customer Estimates / Commercial Approvals | Send estimates and additional work proposals for approval |
| 5 | Change Orders | Manage approved scope, commercial deltas and schedule impact |
| 6 | Proof Pack | Viral before/after evidence reports |
| 7 | AI Daily Digest | Daily automatic project control summary |
| 8 | Punch List / Defects | Defects and final acceptance loop |
| 9 | Handover Pack | Final project closeout package |
| 10 | Telegram Bot Layer | Fast notifications and quick actions |
| 11 | Contractor Directory | Internal contractor quality/rating foundation |
| 12 | Monetization / Packaging | Make it sellable |
| 13 | Production Hardening Final | Security, observability, E2E, release gate closure |

---

# PHASE 0 — LIVE TRUTH VERIFICATION

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Основная привязка к этой Phase: [V2-IOS-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-01), [V2-WEB-22](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-22), [V2-CON-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-con-02), [V2-WEB-29](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-29). Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Prove that production, staging, GitHub main and live Supabase are aligned.

## Tasks

### 0.1 Production SHA verification

Check:

- `https://aistroyka.ai/api/v1/health`
- buildStamp sha
- build time
- env

### 0.2 Staging verification

Check:

- `https://staging.aistroyka.ai/api/v1/health`
- staging buildStamp
- staging smoke status
- staging deploy workflow result

### 0.3 Supabase live schema verification

Verify required live tables:

- tenants
- tenant_members
- projects
- project_members
- worker_tasks
- worker_reports
- media
- upload_sessions
- project_documents
- project_cost_items
- project_milestones
- audit_logs
- alerts

### 0.4 Customer finance isolation pre-audit

Before owner/customer work, inspect whether any existing owner/customer/stakeholder routes expose:

- costs
- budget summary
- cost items
- cost risks
- internal financial signals
- AI finance recommendations

Create a report.

## Deliverables

```text
docs/audit/LIVE_PRODUCTION_TRUTH_REPORT.md
docs/audit/LIVE_SUPABASE_SCHEMA_REPORT.md
docs/audit/LIVE_SMOKE_REPORT.md
docs/security/CUSTOMER_FINANCE_ISOLATION_PREAUDIT.md
```

## Done criteria

- production SHA known
- staging SHA known
- live Supabase table presence verified
- migration dry-run status known
- production smoke result known
- customer finance leak pre-audit completed

---

# PHASE 1 — MANAGER DAILY CONTROL CENTER

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Основная привязка к этой Phase: [V2-ARCH-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-01), [V2-ARCH-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-04), [V2-WEB-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-01), [V2-ARCH-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-02), [V2-ARCH-06](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-06), [V2-CON-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-con-04), [V2-WEB-05](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-05), [V2-IOS-10](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-10), [V2-IOS-15](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-15), [V2-AND-09](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-09), [V2-IOS-17](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-17), [V2-IOS-18](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-18), [V2-IOS-20](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-20), [V2-IOS-21](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-21), [V2-IOS-23](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-23), [V2-WEB-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-02), [V2-WEB-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-03), [V2-WEB-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-04), [V2-WEB-06](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-06), [V2-WEB-07](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-07), [V2-WEB-08](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-08), [V2-WEB-15](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-15), [V2-WEB-26](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-26), [V2-WEB-33](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-33), [V2-ARCH-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-03), [V2-WEB-13](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-13), [V2-WEB-14](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-14), [V2-WEB-18](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-18), [V2-WEB-27](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-27), [V2-WEB-28](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-28), [V2-WEB-32](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-32). Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Turn manager dashboard into a daily control center.

The manager must answer immediately:

> What is burning today and what should I do first?

## Product concept

Create one unified action surface that aggregates:

- overdue work
- missing evidence
- approval queue
- pending documents
- internal cost overruns
- milestone risks
- stale reports
- upload failures
- customer decisions
- customer estimate approvals
- AI risks

## Tasks

### 1.1 Action item inventory

Inspect all existing signal sources:

- project intelligence
- schedule/milestones
- documents
- costs
- approvals
- reports
- uploads
- alerts
- decision requests
- customer estimates
- AI diagnostics

### 1.2 Unified ManagerActionItem model

Add or formalize:

```ts
type ManagerActionItem = {
  id: string
  type:
    | "missing_evidence"
    | "overdue_task"
    | "milestone_at_risk"
    | "approval_pending"
    | "document_review"
    | "internal_cost_overrun"
    | "customer_estimate_pending"
    | "customer_decision_pending"
    | "upload_problem"
    | "ai_risk"
    | "system_alert"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  reason: string
  project_id: string
  project_name?: string
  linked_entity_type?: string
  linked_entity_id?: string
  href: string
  recommended_action: string
  visibility: "internal_manager_only"
  created_at?: string
}
```

### 1.3 Server-side aggregation

Create service:

```text
apps/web/lib/domain/dashboard/manager-actions.service.ts
```

It must:

- collect real data
- avoid fake recommendations
- sort by severity and urgency
- return max 10–20 items
- include drill-down hrefs
- mark internal finance actions as manager-only

### 1.4 API route

Add:

```text
GET /api/v1/dashboard/manager-actions
```

### 1.5 Dashboard UI

Add block:

```text
"What needs attention today"
```

## Customer finance isolation rule

Manager Daily Control Center may show internal finance.
Owner Portal must not consume this route.

## Deliverables

```text
docs/product/PHASE1_MANAGER_DAILY_CONTROL_CENTER.md
docs/product/PHASE1_MANAGER_ACTION_ITEM_STANDARD.md
```

## Done criteria

- manager sees actionable prioritized list
- internal finance actions are manager-only
- route is protected
- no owner/customer access to manager action feed
- tests pass

---

# PHASE 2 — OWNER / CUSTOMER PORTAL

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Основная привязка к этой Phase: [V2-IOS-24](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-24), [V2-IOS-26](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-26), [V2-IOS-27](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-27), [V2-WEB-10](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-10), [V2-WEB-23](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-23). Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Create a customer-facing portal that gives transparent project progress without exposing internal company operations or finances.

## Product promise

Construction company can tell customer:

> You will see your project progress, photos, shared documents, questions requiring your decision, and estimates sent to you for approval.

## Customer must NOT see

- internal project budget
- actual company costs
- cost overruns
- margin
- profitability
- subcontractor costs
- internal cost item list
- manager financial risk
- AI internal finance analysis
- internal company financial health

## Customer CAN see

- estimates sent for approval
- допсметы / additional work proposals
- approved commercial changes
- payment schedule if explicitly configured
- documents intentionally shared
- project progress
- proof photos
- pending questions/decisions

## Tasks

### 2.1 Access model audit

Inspect current roles:

- tenant roles
- project roles
- owner role
- stakeholder role if present
- platform owner/admin

Decide canonical customer-facing roles:

- `client`
- `owner`
- `stakeholder`

Avoid conflict with platform owner cabinet.

### 2.2 Data visibility matrix

Create matrix:

| Data | Manager | Worker | Customer |
|---|---|---|---|
| project summary | yes | limited | yes |
| worker internal IDs | yes | limited | no/limited |
| reports | yes | own | selected/safe |
| media | yes | own | approved/shared |
| documents | yes | no/limited | only shared |
| internal costs | yes | no | no |
| internal budget summary | yes | no | no |
| estimates sent to customer | yes | no | yes |
| approved change order amount | yes | no | yes |
| decisions | yes | own/pending | assigned |
| AI diagnostics | yes/admin | no | no |
| audit logs | admin | no | no |

### 2.3 Owner routes

Create:

```text
/owner
/owner/projects
/owner/projects/[id]
/owner/projects/[id]/progress
/owner/projects/[id]/documents
/owner/projects/[id]/decisions
/owner/projects/[id]/estimates
/owner/projects/[id]/proof
```

No `/owner/projects/[id]/costs`.

### 2.4 Owner APIs

Add safe customer APIs:

```text
GET /api/v1/owner/projects
GET /api/v1/owner/projects/:id
GET /api/v1/owner/projects/:id/progress
GET /api/v1/owner/projects/:id/documents
GET /api/v1/owner/projects/:id/decisions
GET /api/v1/owner/projects/:id/estimates
GET /api/v1/owner/projects/:id/proof
```

### 2.5 Owner dashboard UI

Show:

- project status
- progress summary
- latest approved photos
- upcoming milestones
- pending customer decisions
- documents requiring review
- estimates pending approval
- approved commercial changes
- safe risk summary without internal finance

Do not show:

- costs tab
- budget tab
- cost overrun cards
- internal finance analytics
- manager action feed

### 2.6 Security tests

Test:

- owner cannot open another tenant project
- owner cannot open internal manager routes
- owner cannot access `/api/v1/system/*`
- owner cannot access manager costs routes
- owner cannot see internal AI logs
- owner cannot see unrelated documents
- owner cannot query project cost items

## Deliverables

```text
docs/product/PHASE2_OWNER_PORTAL_ACCESS_MODEL.md
docs/product/PHASE2_OWNER_PORTAL_COMPLETION_REPORT.md
docs/security/PHASE2_OWNER_PORTAL_SECURITY_AUDIT.md
docs/security/PHASE2_CUSTOMER_FINANCE_ISOLATION_REPORT.md
```

## Done criteria

- customer portal works
- access isolation tested
- no internal financial leakage
- customer can see progress, documents, decisions and estimates
- manager can link customer to project

---

# PHASE 3 — DECISION REQUESTS

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Основная привязка к этой Phase: [V2-IOS-25](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-25), [V2-WEB-09](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-09), [V2-WEB-24](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-24). Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Move customer decisions out of WhatsApp and phone calls into structured product workflow.

## Core use cases

- approve material
- choose design
- approve extra work
- accept schedule shift
- approve document
- accept completed work
- answer question
- approve estimate

## Tasks

### 3.1 Domain model

Add table:

```sql
decision_requests
```

Fields:

```text
id
tenant_id
project_id
type
title
description
status
priority
requested_by
assigned_to
due_at
decided_at
decision_note
linked_entity_type
linked_entity_id
customer_visible_amount
customer_visible_currency
created_at
updated_at
```

Types:

```text
design_choice
material_choice
estimate_approval
cost_change_customer_facing
schedule_change
document_approval
work_acceptance
general_question
other
```

Statuses:

```text
pending
approved
rejected
answered
cancelled
expired
```

### 3.2 Customer-visible amount rule

Decision requests may expose a customer-facing amount only if it is explicitly intended for customer approval.

Do not expose:

- internal actual cost
- margin
- internal overrun
- subcontractor cost
- internal cost item details

### 3.3 API routes

Manager:

```text
POST /api/v1/projects/:id/decision-requests
GET /api/v1/projects/:id/decision-requests
PATCH /api/v1/projects/:id/decision-requests/:requestId
```

Owner:

```text
GET /api/v1/owner/projects/:id/decisions
POST /api/v1/owner/projects/:id/decisions/:requestId/respond
```

### 3.4 Manager UI

Add to project detail:

- Decisions tab or panel
- Create decision request
- link to document/task/estimate/milestone
- status list
- overdue decision highlight

### 3.5 Owner UI

In Owner Portal:

- pending decisions
- approve/reject/answer
- comments
- attached photos/documents
- estimate/change amount only when customer-facing

### 3.6 Audit trail

Log every decision state change.

### 3.7 Integration with Manager Daily Control Center

Pending/overdue decisions must appear as manager actions.

## Deliverables

```text
docs/product/PHASE3_DECISION_REQUESTS_DOMAIN.md
docs/product/PHASE3_DECISION_REQUESTS_UI_REPORT.md
docs/product/PHASE3_DECISION_REQUESTS_SECURITY_AUDIT.md
```

## Done criteria

- manager can create decision request
- customer can respond
- status updates
- audit trail exists
- no internal finance fields exposed to owner/customer
- manager dashboard sees pending/overdue decisions

---

# PHASE 4 — CUSTOMER ESTIMATES / COMMERCIAL APPROVALS

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Основная привязка к этой Phase: [V2-WEB-17](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-17). Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Create a customer-facing estimate approval layer.

This is separate from internal cost control.

## Why

Customer should approve:

- initial estimate
- additional estimate
- commercial proposal
- payment milestone
- scope change price

Customer should not see internal costs.

## Tasks

### 4.1 Domain model

Add:

```sql
customer_estimates
```

Fields:

```text
id
tenant_id
project_id
title
description
status
total_amount
currency
valid_until
created_by
sent_to_customer_at
approved_by_customer_at
rejected_by_customer_at
customer_note
linked_document_id
linked_decision_request_id
created_at
updated_at
```

Statuses:

```text
draft
sent
approved
rejected
expired
cancelled
superseded
```

### 4.2 Estimate line items

Optional but recommended:

```sql
customer_estimate_items
```

Fields:

```text
id
estimate_id
title
description
quantity
unit
unit_price
total_price
sort_order
```

Important:
These are commercial line items, not internal cost items.

### 4.3 API

Manager:

```text
POST /api/v1/projects/:id/estimates
GET /api/v1/projects/:id/estimates
PATCH /api/v1/projects/:id/estimates/:estimateId
POST /api/v1/projects/:id/estimates/:estimateId/send
```

Owner:

```text
GET /api/v1/owner/projects/:id/estimates
GET /api/v1/owner/projects/:id/estimates/:estimateId
POST /api/v1/owner/projects/:id/estimates/:estimateId/respond
```

### 4.4 Integration with decision requests

When an estimate is sent to customer:

- create linked decision request of type `estimate_approval`
- owner approves/rejects
- estimate status updates

### 4.5 Manager UI

Project tab:

```text
Estimates
```

Features:

- create estimate
- add commercial line items
- attach document/PDF
- send for approval
- see customer response

### 4.6 Owner UI

Owner Portal:

```text
Estimates to approve
```

Shows:

- title
- description
- total customer-facing amount
- line items if intended
- document attachment
- approve/reject
- comment

### 4.7 Isolation from internal costs

Do not use `project_cost_items` as owner response payload.
If internal costs need to generate estimate draft, create explicit sanitized estimate copy.

## Deliverables

```text
docs/product/PHASE4_CUSTOMER_ESTIMATES_DOMAIN.md
docs/product/PHASE4_CUSTOMER_ESTIMATES_UI_REPORT.md
docs/security/PHASE4_ESTIMATE_FINANCE_ISOLATION_AUDIT.md
```

## Done criteria

- manager creates estimate
- manager sends estimate to owner
- owner approves/rejects
- approved estimate visible as customer-approved commercial item
- no internal cost/margin leak
- tests cover finance isolation

---

# PHASE 5 — CHANGE ORDERS / ДОПРАБОТЫ

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Самостоятельные V2 пакеты в эту Phase не добавлены; её существующие требования и gates сохраняются. Связанные проверки перечислены в полной карте. Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Create controlled extra work process.

## Why

This is a core construction business process.
Many disputes come from unstructured extras.

## Important finance rule

Change order may show the customer-approved commercial price.
It must not show internal implementation cost, margin, profit, or budget pressure.

## Tasks

### 5.1 Domain model

Add:

```sql
change_orders
```

Fields:

```text
id
tenant_id
project_id
title
description
reason
customer_amount_delta
currency
schedule_delta_days
status
linked_task_id
linked_document_id
linked_customer_estimate_id
linked_decision_request_id
internal_cost_item_id
created_by
approved_by_customer
approved_at
created_at
updated_at
```

Do not expose `internal_cost_item_id` to customer APIs.

Statuses:

```text
draft
sent_to_owner
approved
rejected
implemented
cancelled
```

### 5.2 API

Manager:

```text
POST /api/v1/projects/:id/change-orders
GET /api/v1/projects/:id/change-orders
PATCH /api/v1/projects/:id/change-orders/:changeOrderId
POST /api/v1/projects/:id/change-orders/:changeOrderId/send
```

Owner:

```text
GET /api/v1/owner/projects/:id/change-orders
POST /api/v1/owner/projects/:id/change-orders/:changeOrderId/respond
```

### 5.3 Cost integration

If approved:

- optionally create internal cost item
- update internal budget summary for managers only
- customer sees only approved commercial change amount

### 5.4 Schedule integration

If approved and `schedule_delta_days > 0`:

- mark milestone schedule pressure
- show in manager schedule
- show owner-friendly schedule impact

### 5.5 Documents integration

Generate optional act/document placeholder after approval.

## Deliverables

```text
docs/product/PHASE5_CHANGE_ORDERS_DOMAIN.md
docs/product/PHASE5_CHANGE_ORDERS_INTEGRATION_REPORT.md
docs/security/PHASE5_CHANGE_ORDER_FINANCE_ISOLATION_AUDIT.md
```

## Done criteria

- manager creates change order
- owner approves/rejects customer-facing price
- approved change affects internal costs only for manager
- owner cannot see internal costs
- schedule impact visible in safe form
- audit trail exists

---

# PHASE 6 — PROOF PACK / BEFORE-AFTER EVIDENCE

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Основная привязка к этой Phase: [V2-CON-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-con-03), [V2-AND-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-03), [V2-AND-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-04), [V2-AND-07](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-07), [V2-IOS-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-04), [V2-IOS-05](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-05), [V2-IOS-06](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-06), [V2-IOS-13](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-13), [V2-IOS-14](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-14), [V2-AND-08](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-08), [V2-IOS-19](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-19), [V2-WEB-12](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-12), [V2-WEB-16](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-16), [V2-WEB-25](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-25). Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Create the most viral product feature:
shareable proof of completed construction work.

## Customer finance rule

Proof Pack must not expose internal financial state.
It may show approved commercial estimate/change reference only if intentionally included.

## Tasks

### 6.1 Evidence classification

Ensure media supports:

- before
- after
- progress
- issue
- document
- other

### 6.2 Task Proof Pack

For each task:

- task title
- before photos
- after photos
- assigned worker display name if allowed
- report link
- submitted at
- approved/rejected status
- manager note approved for customer visibility
- AI evidence quality/evidence completeness score

### 6.3 Project Proof Pack

Project-level summary:

- completed tasks
- accepted reports
- photos grouped by milestone/task
- customer-visible documents
- decisions
- approved customer-facing change orders
- punch items once Phase 8 exists

### 6.4 Share link

Create tokenized share route:

```text
/share/proof/:token
```

Rules:

- scoped to one project/proof pack
- expiration optional
- revocable
- no internal admin data
- no internal finance data
- no raw tenant leakage

## Deliverables

```text
docs/product/PHASE6_PROOF_PACK_DOMAIN.md
docs/product/PHASE6_SHARE_LINK_SECURITY.md
docs/product/PHASE6_PROOF_PACK_REPORT.md
```

## Done criteria

- manager can create/open proof pack
- customer can view proof pack
- share link safe
- no internal leakage
- no internal finance leakage
- proof pack is visually strong and mobile-friendly

---

# PHASE 7 — AI DAILY DIGEST

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Основная привязка к этой Phase: [V2-ARCH-05](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-05), [V2-IOS-22](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-22), [V2-WEB-11](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-11). Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Generate daily automatic construction control summary.

## Digest types

### Manager digest

May include internal signals:

- completed work
- missing evidence
- overdue tasks
- milestone risks
- document review needs
- internal cost overruns
- pending customer decisions
- estimates awaiting customer approval
- top 3 risks
- recommended actions

### Owner digest

Must exclude internal financial state.

Can include:

- progress summary
- approved work
- photos
- pending decisions
- estimate approval requests
- approved commercial changes
- customer-visible documents
- safe schedule impact

Must not include:

- internal cost overrun
- internal budget pressure
- margin
- profitability
- internal AI finance risk
- subcontractor costs

## Tasks

### 7.1 Digest generation service

Create:

```text
apps/web/lib/domain/digest/daily-digest.service.ts
```

### 7.2 Audience separation

Digest service must require:

```ts
audience: "manager" | "owner"
```

The service must use different data projection per audience.

### 7.3 Digest records

Optional table:

```sql
project_daily_digests
```

Fields:

```text
id
tenant_id
project_id
audience
summary_json
created_at
created_by_system
```

### 7.4 Dashboard UI

Manager:

- daily digest card
- regenerate if allowed
- open details

Owner:

- daily summary on portal

## Deliverables

```text
docs/ai/PHASE7_DAILY_DIGEST_STANDARD.md
docs/ai/PHASE7_DAILY_DIGEST_REPORT.md
docs/security/PHASE7_DIGEST_FINANCE_ISOLATION_AUDIT.md
```

## Done criteria

- digest generated from real data
- manager and owner versions separated
- owner digest excludes internal finance
- tests cover empty/partial/risky project states
- tests cover customer finance isolation

---

# PHASE 8 — PUNCH LIST / DEFECTS

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Самостоятельные V2 пакеты в эту Phase не добавлены; её существующие требования и gates сохраняются. Связанные проверки перечислены в полной карте. Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Support final defect tracking and acceptance.

## Implementation note (repo)

Punch list / defects are modeled as **`public.project_defects`** (migration `20260404120000_project_defects.sql`), not a separate `punch_items` table. Status vocabulary differs slightly from the sketch below (`ready_for_verification`, `resolved`, `closed` vs `ready_for_review`, `accepted`, etc.). Follow-up migrations may add roadmap fields — e.g. optional severity and before/after photo links to **`worker_report_media`** (`20260507193000_project_defects_severity_and_photos.sql`).

## Tasks

### 8.1 Domain model

Roadmap shorthand `punch_items` maps to **`public.project_defects`**. Comparable fields:

```text
id
tenant_id
project_id
title
description
status
severity
assigned_to
due_date (date column)
photo_before_report_media_id  (references worker_report_media; roadmap “before” evidence)
photo_after_report_media_id  (references worker_report_media; roadmap “after” evidence)
accepted_by
accepted_at
created_at
updated_at
```

Statuses:

```text
open
in_progress
ready_for_review
accepted
rejected
cancelled
```

### 8.2 Manager UI

Project tab:

```text
Defects / Punch list
```

### 8.3 Worker flow

Worker sees assigned punch item.
Can upload after photo.
Can mark ready for review.

### 8.4 Owner visibility

Owner can see customer-visible punch list:

- open defects
- fixed defects
- accepted items
- no internal financial data

## Deliverables

```text
docs/product/PHASE8_PUNCH_LIST_DOMAIN.md
docs/product/PHASE8_PUNCH_LIST_REPORT.md
```

## Done criteria

- defects can be created, assigned, fixed, reviewed
- photos supported
- overdue/critical defects appear in manager actions
- owner-safe view exists

---

# PHASE 9 — HANDOVER PACK

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Основная привязка к этой Phase: [V2-WEB-31](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-31). Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Implementation note (repo, Phase 9 v1)

- Readiness blockers: `computeHandoverReadiness` / `computeHandoverReadinessFromSummary` (`handover-readiness.ts`).
- **Customer handover pack** (preview + print): `GET /api/v1/projects/:id/handover/pack`, domain `handover-pack.service.ts`, UI `/dashboard/projects/:id/handover/pack`. Browser print is the initial export surface; PDF optional later.

## Goal

Create final project closeout package.

## Handover content

Customer-visible:

- project summary
- completed milestones
- accepted reports
- proof packs
- customer-visible documents/acts/contracts
- approved change orders
- approved estimates
- closed punch list
- customer decisions history
- warranty/guarantee notes if present

Manager-internal only:

- internal cost summary
- profitability
- internal budget state
- internal risk notes
- contractor cost analytics

## Tasks

### 9.1 Handover readiness service

Create service that returns:

```ts
{
  ready: boolean
  blockers: HandoverBlocker[]
  sections: HandoverSection[]
}
```

Blockers:

- open punch items
- unsigned customer-visible documents
- pending approvals
- unresolved decisions
- missing final proof
- pending estimate/change approvals

Do not include internal budget not finalized as a customer-visible blocker.
Manager may see internal finance readiness separately.

### 9.2 Manager UI

Button:

```text
Prepare handover
```

Show:

- readiness score
- blockers
- preview
- share/export

### 9.3 Owner UI

Owner can view customer handover pack.

### 9.4 Export

Start with print-friendly HTML.
Add PDF later if stable.

## Deliverables

```text
docs/product/PHASE9_HANDOVER_PACK_REPORT.md
docs/product/PHASE9_HANDOVER_READINESS_STANDARD.md
docs/security/PHASE9_HANDOVER_FINANCE_ISOLATION_AUDIT.md
```

## Done criteria

- handover readiness works
- blockers are clear
- handover pack generated
- owner can view
- no internal data leak
- no internal finance leak

---

# PHASE 10 — TELEGRAM BOT LAYER

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Самостоятельные V2 пакеты в эту Phase не добавлены; её существующие требования и gates сохраняются. Связанные проверки перечислены в полной карте. Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Use Telegram as a communication and quick-action layer, not as the only auth system.

## Bot use cases

### Worker

- receive task
- upload photo
- submit quick report
- receive reminder

### Owner

- receive decision request
- approve/reject
- open proof pack
- receive customer-safe digest
- approve estimate/change order

### Manager

- receive top risks
- receive overdue alert
- open dashboard

## Security / finance rule

Telegram owner messages must not include internal finance.
They can include:

- estimate approval request
- approved commercial amount
- link to customer portal

## Deliverables

```text
docs/integrations/PHASE10_TELEGRAM_BOT_DESIGN.md
docs/integrations/PHASE10_TELEGRAM_SECURITY_MODEL.md
docs/product/PHASE10_TELEGRAM_REPORT.md
```

## Done criteria

- linking works
- at least one manager notification works
- at least one owner decision notification works
- audit trail exists
- no Telegram-only auth dependency for core platform
- no internal finance leak in owner Telegram messages

---

# PHASE 11 — CONTRACTOR DIRECTORY

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Самостоятельные V2 пакеты в эту Phase не добавлены; её существующие требования и gates сохраняются. Связанные проверки перечислены в полной карте. Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Create internal contractor quality directory before any public marketplace.

## Important customer visibility rule

Contractor performance metrics are internal.
Customer should not see:

- contractor rating
- rejection rate
- delay analytics
- internal notes
- cost rates

## Tasks

### 11.1 Contractor profile

Fields:

```text
id
tenant_id
user_id
company_name
specializations
phone
email
status
notes
```

### 11.2 Performance metrics

Calculate:

- tasks completed
- reports submitted
- missing evidence rate
- rejection rate
- average delay
- active projects
- quality score

### 11.3 Manager UI

Directory:

- list contractors
- filter by specialization
- open profile
- see performance

## Deliverables

```text
docs/product/PHASE11_CONTRACTOR_DIRECTORY_REPORT.md
```

(Implementation: `tenant_contractor_profiles`, `/api/v1/contractors/directory`, dashboard `/dashboard/contractors`.)

## Done criteria

- contractor profile exists
- metrics generated
- manager can select/filter contractors
- no public marketplace scope creep
- no contractor internal metrics shown to customer

---

# PHASE 12 — MONETIZATION / PACKAGING

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Основная привязка к этой Phase: [V2-PUB-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-01), [V2-PUB-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-02), [V2-PUB-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-03), [V2-PUB-04](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-04), [V2-PUB-05](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-05), [V2-PUB-06](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-06), [V2-PUB-07](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-07), [V2-PUB-08](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-pub-08), [V2-WEB-21](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-21), [V2-WEB-30](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-30). Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Make product sellable.

## Plans

### Starter

For small teams:

- 1–3 projects
- limited users
- reports/photos
- basic proof pack
- owner portal
- estimate approvals

### Pro

For growing companies:

- documents
- internal costs
- decision requests
- customer estimates
- change orders
- AI daily digest

### Business

For serious contractors:

- advanced permissions
- custom branding
- Telegram integration
- handover pack
- contractor analytics

### Enterprise

- SSO later
- advanced audit
- custom retention
- dedicated support
- integrations

## Important pricing rule

Do not imply customer gets access to company internal finance.
Phrase customer-side value as:

- estimate approval
- transparent progress
- proof of completed work
- decisions in one place
- shared documents

## Deliverables

```text
docs/business/PHASE12_PACKAGING_AND_PRICING.md
docs/product/PHASE12_PLAN_LIMITS_IMPLEMENTATION.md
docs/product/PHASE12_ROADMAP_CLOSURE.md
```

## Done criteria

- features mapped to plans
- limits enforceable
- pricing page matches product reality
- no fake enterprise claims
- customer finance isolation reflected in marketing copy

---

# PHASE 13 — FINAL PRODUCTION HARDENING

> **Уточнение аудита V2 — 20.10.2026.** [Правила включения 97 пакетов](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) и [полная карта](product-experience-audit-2026-10-19/CANONICAL_MAPPING_RU.md). Основная привязка к этой Phase: [V2-ARCH-07](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-07), [V2-ARCH-09](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-09), [V2-AND-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-01), [V2-AND-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-02), [V2-CON-01](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-con-01), [V2-IOS-02](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-02), [V2-IOS-03](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-03), [V2-AND-05](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-05), [V2-AND-06](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-06), [V2-IOS-07](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-07), [V2-IOS-08](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-08), [V2-IOS-09](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-09), [V2-IOS-11](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-11), [V2-IOS-12](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-12), [V2-IOS-16](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-16), [V2-AND-10](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-10), [V2-AND-11](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-11), [V2-AND-12](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-12), [V2-ARCH-08](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-arch-08), [V2-IOS-28](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-28), [V2-IOS-29](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-29), [V2-WEB-19](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-19), [V2-WEB-20](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-web-20), [V2-AND-13](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-and-13), [V2-IOS-30](product-experience-audit-2026-10-19/MEGA_PLAN_RU.md#v2-ios-30). Это детализация/приёмка, не переоткрытие всей фазы и не изменение pilot/release scope.


## Goal

Before serious sales, close operational risks.

## Workstreams

### 13.1 Security audit

- tenant isolation
- owner/customer isolation
- customer finance isolation
- share token security
- system routes
- admin/operator routes
- RLS verification

### 13.2 Observability

- request_id everywhere
- AI runtime logs
- smoke artifacts
- alerting for deploy failure
- error budget basics

### 13.3 E2E

Minimum flows:

- manager login
- create project
- invite/add worker
- worker report with media
- manager approve
- create document
- create estimate
- send estimate to owner
- owner approve estimate
- create decision request
- owner response
- create change order
- proof pack share
- handover readiness

### 13.4 Customer finance isolation tests

Required negative tests:

- owner cannot access manager costs route
- owner cannot access project cost item list
- owner cannot see internal cost overrun
- owner cannot see internal budget summary
- owner cannot see AI internal finance risk
- owner can see only estimates sent to owner
- share proof does not include internal finance
- owner digest excludes internal finance

### 13.5 Release discipline

- CI green
- staging deploy
- pilot smoke
- production deploy
- production smoke
- rollback runbook

## Deliverables

```text
docs/audit/FINAL_PRODUCTION_READINESS_AUDIT.md
docs/audit/FINAL_SECURITY_AUDIT.md
docs/audit/FINAL_E2E_REPORT.md
docs/security/FINAL_CUSTOMER_FINANCE_ISOLATION_AUDIT.md
docs/product/PHASE13_ROADMAP_CLOSURE.md
```

**Note:** There is no separate **Phase 14** product chapter in this file. Section **14** is the Cursor execution template; **§15** is the strategic verdict. Closure of Phase 13 against live criteria is recorded in `PHASE13_ROADMAP_CLOSURE.md` and operator smoke logs.

## Done criteria

- no P0/P1 open
- staging green
- production smoke green
- core E2E green
- customer finance isolation green
- clear launch checklist

---

# 14. CURSOR EXECUTION TEMPLATE

Use this for each phase:

```text
YOU ARE CURSOR.
Act as a Principal Product Engineer + Release Engineer + Security-Aware SaaS Architect.

Project: AISTROYKA.

MISSION:
Execute ONLY the current phase from AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md.

Current phase:
[INSERT PHASE NAME]

GLOBAL RULE:
Customer / owner must never see internal financial state of the construction company.
Customer may only see estimates, additional proposals, approved commercial changes, payment schedule if intentionally configured, and decisions that depend on the customer.

RULES:
1. Do not move to the next phase.
2. Do not add unrelated features.
3. Do not weaken auth, tenant boundaries, RLS or role checks.
4. Do not create fake placeholder UI.
5. Do not mark complete without tests/build and post-audit.
6. Every new API must use contracts/validation where project patterns require it.
7. Every customer/owner/share surface must be security-reviewed.
8. Every owner/customer route must be checked for internal finance leakage.
9. All material changes must be documented.

EXECUTION:
1. Inspect current repo state.
2. Create an implementation plan.
3. Implement incrementally.
4. Run focused tests.
5. Run full validation:
   - bun run lint
   - bun run test
   - bun run build
   - bun run cf:build
6. Create required docs for this phase.
7. Produce final post-audit:
   - what was implemented
   - what was validated
   - open risks
   - customer finance isolation verdict
   - exact blockers if any
   - final verdict YES/NO

CLOSURE RULE:
If there is any meaningful unfinished work, mark the phase NOT CLOSED and list exact next actions.
```

---

# 15. FINAL STRATEGIC VERDICT

The next high-impact sequence is:

1. Live truth verification
2. Manager Daily Control Center
3. Owner / Customer Portal without internal finance
4. Decision Requests
5. Customer Estimates / Commercial Approvals
6. Change Orders
7. Proof Pack

This sequence turns AISTROYKA into a product that construction companies can sell to their customers as transparency and trust.

The correct customer promise is:

> Customer sees progress, proof, documents, estimates for approval, and decisions that depend on them.

The incorrect customer promise is:

> Customer sees the builder company’s internal budget, costs, overruns, margin or financial condition.

Do not expose internal finance to customer.

Build the trust loop first.

## Amendment — 2026-09-23 (reconciled 2026-10-03)

[Customer iOS, async/live intake, evidence and Graph backlog](AISTROYKA_PLAN_AMENDMENT_2026-09-23.md). This extends existing phases. It does not reopen completed phases or expand the active contractor-ops-only production pilot without a separate verified release slice.


## Дополнение — полный аудит продукта V2, 2026-10-20

[Интеграция V2](AISTROYKA_V2_AUDIT_INTEGRATION_2026-10-20.md) включает все 97 пакетов, 73 находки, 406 критериев, 243 будущих проверки и дизайн-задание MagicPath в существующие Phase 0–13/AIS IDs. Полные карточки/архитектура/исходные snapshot находятся [в приложении к плану](product-experience-audit-2026-10-19/README.md). Первичная навигация по пакетам добавлена внутри каждой Phase. Исполнение — по свежему source/PR gap, с отдельными contractor-core, Customer, AI, commercial и deferred Android scopes; документация не закрывает runtime/release gates.
