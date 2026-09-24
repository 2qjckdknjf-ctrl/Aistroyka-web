# ROMA / инженерный Grow OS — Execution Assurance, 2026-09-23

Статус: PLANNED; расширение [ROMA roadmap](ROMA_ROADMAP.md), не новая параллельная система.
Сохранить ADR-0007 recommendation-only и существующие product/release gates. Блокирующий режим возможен только отдельным ADR и проверенным executor integration.
Инженерный Grow OS не равен маркетинговому репозиторию growth-os. Канонический отдельный engineering repo пока не установлен; этот документ — ROMA contract/backlog, не объявление созданного runtime.

## Backlog и порядок

| ID | Stage / очередь | Deliverable и проверяемый критерий |
|---|---|---|
| ROMA-VER-009 / GROW-MEM-004 | 2D→3, P0 | Assurance Graph: Requirement → Acceptance Criterion → Verification Contract → Test/Observation → Evidence → Verifier → Verdict. ID/revision, artifact hash, commit SHA, environment, timestamps, tool version и origin обязательны. Missing/failed/stale evidence не даёт PASS. Покрытие считается по release requirements, включая ручные критерии, а не числу тестов. |
| GROW-AUDIT-007 | 3/7, P0 | Staleness: mapping requirement↔code/config/schema/dependency/test; изменение транзитивной зависимости инвалидирует evidence. Неизвестная зависимость требует conservative revalidation; нового зелёного теста недостаточно для снятия всех stale флагов. Тесты: auth/config/lockfile/schema change, unrelated change, deleted requirement, повторный run. |
| ROMA-EXEC-001 | 3, P0 | Coding Runtime Adapter: task/run ID, input/output schema, cancellation, timeout, budget, artifacts, normalized errors; Cursor/Codex подключаются через contracts. Dry-run и повтор не создают повторных side effects. Intent routing выбирает разрешённую capability по задаче, а не расширяет permissions. |
| ROMA-POL-001 | 3/4, P0 | Per-task risk/autonomy policy + ModelManifest. Отдельно хранить autonomy label, permissions, approvals, allowed resources и budget. Model ID/version/capabilities/data policy/eval evidence/versioned fallback обязательны; неизвестная модель или fallback не получает больше прав. |
| ROMA-CAP-001 | 3/4, P0 | Capability manifest: publisher/source/revision/content digest, input/output, requested permissions, dependencies и review status. Pin dependency/tool revisions, проверять digest и доверие к источнику. Изменение manifest/digest инвалидирует approval; hash сам по себе не доказывает доверенность. |
| ROMA-ENV-001 | 3/4, P0 | Environment Boundary Verifier: account/project/tenant/host/resource identity, environment и credential scope проверяются до каждого privileged call. Wrong account, staging token к production, redirect и TOCTOU требуют deny/revalidation; строки prompt не являются доказательством окружения. |
| ROMA-EGRESS-001 | 3/4, P0 | Data Egress Gate: classification, destination/region, retention/training policy, allowed fields, repo upload scope. Запрет неизвестного назначения и secret/raw sensitive data; redact traces. Проверки nested payload, attachments, redirects, shell/network bypass. |
| ROMA-GUARD-001 | 3/4, P1 после contract suite | Online Guard на broker/tool boundary, sandbox per run до выполнения, минимальные права и закрытый по умолчанию egress. Проверять intent vs actual call, approval scope/expiry/replay и policy revision; остановка не отменяет уже совершённый эффект — нужен reconciliation. Привилегированная операция не исполняется при отказе обязательного audit log. |
| ROMA-EVAL-001 | 3/7, P1 | Inline evaluator после шага + offline audit полной трассы. Executor не утверждает свой final verdict; verifier проверяет подлинность artifacts и не наследует execution credentials. Модельная оценка дополняет deterministic checks. Advisory report ≠ release authorization. |
| ROMA-INC-001 | 7, P1 | Agent Execution Incident: run/task, denied/attempted action, resource, policy version, sanitized evidence, containment, owner, resolution. Remediation только через reviewable PR и regression evidence; никаких self-approved production fixes. |
| ROMA-OBS-001 | 7/8, P1 | Dashboard: fresh requirement coverage, stale/missing evidence, guard false-positive/false-negative на adjudicated fixtures, escalation, p50/p95 latency, incident recurrence, cost/verified requirement. Empty denominator = unavailable, не 100%; offline eval отделён от live статистики. |
| ROMA-PAR-001 | 8, LATER | Dependency-based parallel tasks только для независимых write sets, isolated workspaces и budgets; coordinator проверяет conflicts и совместное evidence. Гонки, cancellation и частичный failure покрыты проверками. Не включать autonomous parallel execution этим docs PR. |
| ROMA-AUTH-001 | 4, LATER | Strong auth/step-up для выбранных privileged операций; явное approval привязано к resource/action/diff/budget/expiry. Authentication не заменяет authorization и human approval. |

## Contract первого slice
Минимальный fixture: REQ-AUTH-PROJECT-001 с двумя AC (свой проект разрешён, чужой запрещён); tests + evidence привязаны к SHA. Изменить auth dependency: оба evidence становятся stale; удалить одно доказательство: verdict INCOMPLETE; повторная верификация независимым verifier восстанавливает только подтверждённые AC.
JSON schema validation и traceability report сначала локально/advisory, без нового обязательного production gate. Данные схемы — обезличенные fixtures, не реальные секреты/трейсы.
Первый PR: schema + fixtures + stale detection + report; следующие отдельно adapter, policy/boundary/egress, sandbox/guard и audit. Нельзя объявить весь safety stack завершённым после одной схемы.

## Cursor execution
Сверить существующие ROMA schemas/ADRs/tests и Stage 2D/3/4/7 перед добавлением кода. Сохранить текущие task IDs, повторяющиеся пункты связать alias, не создавать двойные backlog entries.
Для каждого PR: scope, dependency, AC, negative cases, evidence SHA, независимый verdict, ограничения.
Новости и названия будущих моделей — непроверенные research inputs, не основание для vendor lock-in или отмены текущих P0.

## Уточнение плана — 2026-09-24

Статус всех пунктов ниже: PLANNED. Это детализация существующих ROMA-POL/EXEC/GUARD/EVAL/OBS, а не параллельный security stack. Внешние новости, версии моделей, цены и benchmarks из дайджестов 23–24 сентября не проверены; в backlog переносим инженерные требования, не утверждения о релизах.

### ROMA-TRACE-002 — OTel-compatible Execution Trace (P0 contracts, P1 adapter)
Родитель ROMA-OBS-001; зависит от ROMA-EXEC-001 и egress contract.
Использовать OpenTelemetry как формат транспортировки execution spans; отдельный ROMA evidence record остаётся источником проверяемого verdict. Трасса сама по себе не доказывает correctness.
Связи session/run → model request → tool call → result; task/requirement/evidence связываются trace/span IDs и links. Cross-runtime adapter объявляет поддерживаемые поля; отсутствие native OTel у runtime не выдавать за готовую интеграцию.

Минимум: execution_id, task_id, agent_id, provider/model version, capability/tool version, environment, start/end/duration, outcome/error, usage и cost с валютой/источником тарифа. Unknown cost = null, не 0.
ROMA attributes: roma.project_id, roma.requirement_id, roma.risk_level, roma.autonomy_level, roma.environment, roma.capability_digest, roma.approval_id, roma.policy_decision, roma.evidence_id, roma.policy_revision. При реализации сверить актуальные официальные OTel semantic conventions; custom namespace/version сохранять.
Prompt/response, tool payloads, credentials, PII по умолчанию не экспортировать; allowlist attributes и redaction до exporter, tenant isolation и retention обязательны. Высокая cardinality IDs остаётся в traces, не metric labels.
AC: trace одного synthetic task восстанавливает последовательность вызовов; propagated IDs переживают retry; cancelled/denied/error различимы; секретные canary values отсутствуют в export. Loss/sampling помечают неполное evidence; security audit events не зависят от sampling. Bounded retry/backpressure и collector outage проверены; privileged actions при недоступном обязательном durable audit следуют fail-closed policy.

### ROMA-RISK-002 — R0–R5 Action Risk & Approval (P0 schema/fixtures)
Родитель ROMA-POL-001. Risk относится к конкретной операции/данным/окружению, не к бренду модели или названию tool.
Таблица задаёт минимальную проектную политику, не предоставляет новых разрешений:

| Risk | Условие выполнения | Пример при соблюдении scope |
|---|---|---|
| R0 | Existing authorization + policy allow | Чтение несекретного разрешённого repo; unit tests только в изолированной среде без side effects |
| R1 | Policy allow + audit | Изменение своей ветки, создание draft PR без release effects |
| R2 | Explicit policy rule + scoped authorization; иначе escalation | Ограниченная reversible external MCP write; произвольная внешняя запись не считается автоматически разрешённой |
| R3 | Explicit human approval + existing gates | Staging migration, protected PR merge |
| R4 | Owner approval + strong auth + resource-bound authorization | Production deploy/migration, изменение security policy |
| R5 | Forbidden automation; отдельный break-glass вне обычного agent flow | Отключение audit/RLS; dual approval само по себе запрет не снимает |

Эти примеры повышаются по фактическим эффектам: tests исполняют код, PR может запускать CI, docs могут менять инструкции/security policy. Неизвестный риск = deny/escalate. Existing stricter repo/org policy всегда побеждает; R0/R1 не отменяют user authorization.
Approval связывается с action/args digest, plan revision, resource/environment, approver, policy revision, budget, expiry и одноразовым использованием для side effects. Смена scope аннулирует approval. AC: expired/replayed/cross-resource approval, изменённый tool digest и disguised production write отвергаются. Policy не изменяется исполнителем ради продолжения задачи.

### ROMA-PLAN-002 — Context Package → Plan Check → Execution (P0 contract)
Родитель ROMA-EXEC-001. Context Package: requirement/revision, AC, relevant files + baseline SHA, ADRs, dependencies, forbidden operations, data/environment constraints, test/evidence expectations.
Plan Check до первого изменения файлов проверяет scope/write set, security/DB/API/migration impact, зависимости, rollback, tests и AC. Результат: PASS / NEEDS_CHANGES / BLOCKED с причинами и plan digest. Approval человека требуется согласно risk policy; низкорисковая уже авторизованная работа не требует нового ручного подтверждения каждого шага.
Plan check в ROMA сначала advisory по ADR-0007. Исполнимый gate требует отдельного ADR; текущие platform permissions не обходятся.
AC: изменение плана/базового SHA после approval требует revalidation; scope drift останавливает дальнейшие privileged steps; plan approval не равно merge/deploy approval.

### ROMA-SANDBOX-002 — Project Sandbox Policy (P0 schema; P1 enforcement)
Родитель ROMA-GUARD-001. Зависимости: capability/environment/egress/risk contracts, runtime adapter и ADR о границе enforcement. Проектный policy — верхняя граница; task/session может только сужать права.
Manifest без секретных значений:
- schema_version, policy_id/revision/digest, project_id, task_id/run_id, risk_level, environment;
- filesystem: canonical read/write roots, deny roots;
- network: default deny, internet/local_network policy, allow_hosts/deny_hosts, ports/protocols;
- credentials: разрешённые secret references для git/GitHub/Supabase/Vercel/Cloudflare, account/resource scope и TTL;
- capabilities: pinned digests, tool/subprocess permissions; limits: duration/processes/storage/egress;
- fail_closed: true; enforcement backend/version и поддерживаемые controls.

Перед запуском runtime доказывает, что ОС/backend обеспечивает ВСЕ обязательные ограничения. Неподдерживаемый control, недоступный sandbox или невалидная policy → DO NOT EXECUTE; advisory verdict ROMA не превращает обязательную runtime изоляцию в необязательную.
Пример Customer App task: write только в isolated worktree, тестовые endpoints; staging credential только если нужен и разрешён конкретной задачей. Production credentials отсутствуют; доступ к production и metadata endpoints закрыт. Нельзя автоматически монтировать весь домашний каталог/SSH agent/env или Docker socket.
AC: path traversal/symlink escape, subprocess inheritance, localhost/LAN/metadata access, DNS/redirect bypass, credential exfiltration и sandbox teardown проверены отрицательными тестами. Deny имеет приоритет, policy hash привязан к trace/evidence. Нельзя fallback к unrestricted execution.
Первый enforcement pilot — synthetic repo + fixture credentials, не product production.

### ROMA-EFFORT-002 — risk-based verification (P1)
Родитель ROMA-EVAL-001. LIGHT для обычных docs/UI copy; STANDARD для bounded features; HIGH для auth/API/RLS/security/migrations; CRITICAL для production infra/trading execution. Классификация учитывает содержимое diff, data surface, environment и incident history; docs с policy changes могут быть HIGH/CRITICAL.
Effort определяет дополнительную глубину проверки, не отменяет required CI/tests/reviewer gates. Фиксировать причины, версию policy, выбранного verifier и независимость от executor.
AC: mixed change получает максимальный обязательный уровень; rename/расширение файла не скрывает security change; unknown surface escalates. Использование другой модели/provider желательно, но не заменяет независимость доступа и проверку artifacts.

### GROW-MODEL-ARENA-001 — provider-neutral Model Arena (P1 offline)
Родители ROMA-POL-001 и ROMA-OBS-001. Model Router учитывает task complexity/risk, confidence target, context, latency, budget и data policy. Нельзя привязывать все docs к одному названию модели.
Одинаковые bounded tasks/context/AC, pinned repo/dataset/config, одинаковые разрешения и бюджеты; независимый verifier, повторные runs и отчёт по failures/rework/incidents. Метрики: verified success, tokens/cache usage, end-to-end latency, total cost включая retries и verification, cost/verified result. При нуле успешных задач стоимость на результат = unavailable/infinite, не 0.
Сравнивать доступные подтверждённые runtime/model IDs из registry. Упомянутые Claude/GPT/Grok — только кандидаты до проверки API, условий обработки данных и тарифов. Public leaderboard используется для shortlist, не для promotion.
AC: holdout tasks не использованы в tuning; фиксированы stop/budget rules; cache/cold runs разделены; failure costs включены; неизвестная цена явно отмечена. Promotion после local evidence, никакого массового переключения по новости.

### Порядок Cursor после первого Assurance Graph slice
1. Дополнить schema/fixtures: context+plan, action risk, sandbox manifest, OTel mapping.
2. Реализовать offline plan/risk checks и adapter trace на synthetic runs.
3. После согласованного ADR — fail-closed sandbox/broker enforcement с negative tests.
4. Подключить effort policy и offline Model Arena; затем scoped product adapter.
Не считать одну валидную JSON schema доказательством работающего sandbox. Все runtime permissions остаются ограничены текущими правилами.
