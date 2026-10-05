# ROMA / инженерный Grow OS — Execution Assurance, 2026-09-23

> Последняя корректировка: 2026-10-03. Последние уточнения — в разделе за 2026-10-03; очередь 2026-10-02 и предыдущие gates сохраняются.

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

Локальный advisory-срез 2026-10-05: `docs/roma/schemas/assurance_graph.schema.md` + `.schema.json`, fixture `docs/roma/fixtures/assurance_graph.REQ-AUTH-PROJECT-001.json`, оценка в `apps/web/lib/roma/assurance-graph.advisory.ts`. Это не production gate.

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

## Уточнение execution contracts — 2026-09-25

Статус: PLANNED. Дополняет существующие ROMA-AUTH-001, ROMA-RISK-002, ROMA-CAP-001 и Model Arena. Новые независимые security подсистемы не создаются. Сведения о релизах GitHub и benchmark цифрах из дайджеста не проверены и не служат доказательством реализации.

### ROMA-AUTH-002 — PresenceProof (P0 contract/fixtures; P1 enforcement)
ROMA-AUTH-001 ранее LATER: подготовка его контракта и негативных fixtures переносится в ближайший contract slice; production enforcement остаётся после ADR, sandbox/broker integration и проверки identity provider.
Раздельные сущности: capability разрешает инструмент; policy разрешает конкретное действие; Approval фиксирует осознанное согласие; PresenceProof подтверждает свежую интерактивную аутентификацию нужного человека. Ни один из этих объектов не заменяет остальные.

PresenceProof: proof_id, issuer/audience, actor_id, action_id, project_id, environment, resource_id, action_args_digest, artifact_sha, approval_id, policy_revision, authenticated_at, auth_strength, expires_at, nonce, evidence_id. Proof выдаёт доверенный сервер после проверки IdP/WebAuthn/MFA assertion; self-reported JSON агента, session cookie, access token и owner_approved=true не являются proof.
Криптографически проверять issuer/audience/signature и freshness; время берётся на сервере. TTL задаёт versioned policy с ограничением clock skew; пример 10 минут не является универсальным default.
Approval UI показывает действие, ресурс, окружение и artifact/version/amount при наличии; свежий login без подтверждения этих деталей не означает согласия на действие.

R4 требует explicit owner approval + достаточный fresh auth; R3 — explicit approval с дополнительным step-up по policy; R0–R2 сохраняют scoped authorization и текущие правила. R5 запрещённые действия остаются запрещены даже при fresh auth/dual approval.
Проверять approval/proof/resource/action match непосредственно перед execution; changed SHA/args/tenant/environment/policy или revoked role инвалидируют разрешение. Nonce потребляется атомарно вместе с durable operation record; concurrent/replayed calls отвергаются. Idempotency key позволяет получить результат уже исполненной операции, но не выполнить её повторно.
Если результат операции после timeout неизвестен — reconciliation до retry; после expiry требуется новый proof для нового исполнения. Недоступный IdP/verifier, отсутствующие обязательные поля, неподдерживаемый strength → fail closed. В traces только proof ID/outcome, без raw assertion/token.

AC: forged/expired/future-dated/wrong-audience proof, cross-actor/project/environment/action, changed artifact, revoked membership, nonce race/replay и verifier outage не дают side effect. Approval deploy SHA A не разрешает migration или deploy SHA B. Привилегированный agent не может сам выдать себе proof. Synthetic fixtures не являются human-presence production evidence.
Внедрять сначала fixtures и advisory ROMA report; mandatory enforcement только в разрешённом executor boundary по отдельному ADR. Текущие gates продолжают действовать.

### ROMA-CAP-002 — Capability lifecycle (P0 contract; P1 registry integration)
Родитель ROMA-CAP-001. Новые и изменённые capabilities: default DENY, в том числе MCP servers, plugins, preview features, новые tools существующего сервера.
Состояния: DISCOVERED → UNTRUSTED → EVALUATION → APPROVED → ENABLED; из активных состояний допустимы SUSPENDED/REVOKED. APPROVED не означает автоматически ENABLED.
Registry key: publisher/source + pinned version/revision + content/schema digest. Evaluation record: requested permissions, dependencies, network/egress targets, environments, sandbox compatibility, provenance, tests/evidence + reviewer. Решение scoped по project/tenant/environment и expires_at; actor и transition reason аудируются.

Новая версия/digest/permissions/dependency/tool schema требует нового review, без наследования enabled status. Alias latest и server-side tool discovery не обходят проверку. Effective permissions — пересечение org/project/task/session policies; любой deny приоритетен. Enable выполняется уполномоченным actor по risk/approval policy, не самим executor.
Suspend немедленно запрещает новые calls и изолирует активную сессию; уже выполненные side effects требуют reconciliation. Revocation распространяется на pinned dependency users; re-enable только с новым evaluation/approval. Недоступный registry или неопределённый статус не дают fallback allow.
AC: unknown tool/new server version, permission expansion, stale evidence, cross-environment approval, revoked dependency и mid-run suspension блокируют вызов. Approved-but-disabled capability не исполняется; runtime обновление не включает новые функции молча.

### GROW-MODEL-ARENA-001 — уточнение метрик
Кроме cost/verified result фиксировать human interventions, policy violations и Verified Success Rate @ zero policy violations: число runs с PASS всех AC и нулём нарушений / все eligible attempted runs, включая failed/aborted. Неполная audit trace исключает run из verified numerator, но не скрывает его из denominator.
Одинаковые Context Package, AC, sandbox policy, tools и budgets; цены/валюты и conversion date сохраняются. Модель с лучшим leaderboard не становится default без local evidence и promotion review.

### Следующий Cursor slice
После Assurance Graph включить PresenceProof/lifecycle schemas и negative fixtures в уже запланированный contract PR. Затем registry/identity adapters и synthetic fail-closed integration. Не расширять security scope следующими слоями до проверки этих компонентов. Данный docs update не включает capability и не меняет permissions.

## Execution plane — корректировка 2026-09-26

PLANNED. Model, agent identity и runtime — разные сущности. Расширяем ROMA-EXEC/POL/CAP/GUARD/OBS/PAR; не создаём ещё один orchestration framework. Microsoft/Docker/OCI Kits/benchmark claims из дайджеста не проверены; ни миграция поставщика, ни покупка cloud runtime этим документом не утверждены.

| ID | Очередь / связь | Deliverable и acceptance criteria |
|---|---|---|
| GROW-IDENTITY-001 | P0 contract, родитель ROMA-EXEC-001 | AgentIdentity: agent_id, role, accountable owner, project/tenant scope, approved capability refs, memory namespace, workspace binding, environment, budget policy, autonomy level, policy version, lifecycle/revocation. Stable logical identity отделена от run/session и workload credential. Owner ≠ агент; identity не является human PresenceProof. Проверки cross-tenant memory/workspace, revoked identity и scope escalation блокируют доступ. |
| GROW-RUNTIME-002 | P0 interface, P1 synthetic backend; ROMA-EXEC-001 + ROMA-SANDBOX-002 | Provider-neutral local/cloud/CI runtime contract: create, policy validation, start, status, checkpoint, resume, cancel, collect artifacts, destroy. Объявлять supported controls, platform/architecture, isolation class, egress/data residency, credential delivery, budgets и TTL. Нет silent fallback к более слабой изоляции. |
| ROMA-PACKAGE-001 | P0 schema, P1 packaging; ROMA-CAP-001/002 | Immutable Agent Package: manifest, instructions, skills, pinned tool/MCP definitions, dependency lock/SBOM, sandbox/network policies, secret binding references, model requirements, tests, version и content digest. Никаких secret values, пользовательской памяти или workspace data внутри package. Digest покрывает все исполняемые inputs; latest tags не источник доверия. OCI-compatible carrier — кандидат реализации после официальной спецификации/compatibility spike. |
| ROMA-PACKAGE-002 | P1 после package + evidence | Подписанная verification attestation: package digest, test suite/evidence SHAs, policy/model/runtime versions, evaluator identity, scope, timestamp/expiry и revocation status. Проверять trusted signer, signature, digest и свежесть evidence перед запуском. Подпись доказывает provenance, не безопасность всех будущих действий. |
| GROW-BUDGET-001 | P0 contract, P1 ledger; ROMA-POL/OBS | AgentBudget: max_task_cost, daily/monthly limits, token/runtime/search limits, model allowlist, currency, billing period/timezone, policy version. Атомарный reserve→settle ledger для parallel workers/retries; parent task и children делят один aggregate cap. Нет новых paid calls при exhausted/unknown budget без разрешённой bounded policy. |
| ROMA-PAR-001 | LATER, порядок сохранён | Coordinator→workers на task graph; каждому свой identity/session/workspace, package digest, policy и выделенный budget. Write sets/dependencies контролируются; integration run отдельно проверяет совместный результат. Не запускать persistent agents или parallel jobs этим docs PR. |

### Identity, память и unattended lifecycle
Долгоживущий agent имеет состояние ACTIVE/PAUSED/REVOKED, owner, расписание/trigger policy, heartbeat/lease, kill switch и максимальный срок run. Memory хранит source/provenance/retention и access scope; внешние документы/старые заметки не могут менять permissions или становиться системными инструкциями.
Без присутствия пользователя разрешены только ранее авторизованные операции в пределах policy/budget; action, требующий нового PresenceProof, ставит run в WAITING_FOR_APPROVAL. Proof нельзя продлить или восстановить из checkpoint. Revocation прекращает новые tool calls и отзывает session credentials.

### Перенос local → cloud и microVM
Checkpoint содержит versioned state, repo SHA, package/policy digests, artifact references и operation ledger, но не bearer credentials/PresenceProof. При resume: revalidate identity, policy, capabilities, environment, region/egress, budget и evidence; получить новые scoped credentials. Смена runtime — проверяемый handoff, не обещание прозрачной live migration.
Lease/fencing предотвращает одновременное исполнение старой и новой сессии. AC: network partition, crash after side effect, duplicated resume и cancel не создают повторные записи; uncertain outcome требует reconciliation.
MicroVM — поддерживаемый isolation backend, не автоматическая гарантия безопасности. Нужен threat model и negative tests конкретной реализации. Если risk policy требует VM-level boundary, plain container не считается эквивалентом. Cloud недоступен или не соответствует policy → blocked.
Linux cloud runner не доказывает возможность iOS build/device QA: platform/toolchain/signing requirements проверяются, Mac/device задачи маршрутизируются в подходящий approved runner.

### Package verification и FinOps
ROMA “certification” означает только внутренний scoped verification verdict, не внешнюю сертификацию и не бессрочный PASS. Изменение instructions/tool/dependency/policy/model requirements создаёт новый digest и evaluation. Approved package всё равно проходит per-action risk, approval, capability и PresenceProof gates.
AC: tampered/unsigned/untrusted/revoked/expired attestation, несовместимый runtime и отсутствующая dependency provenance запрещают execution. Independent signer/verifier не использует credentials executor.
Budget учитывает model/cache, runtime/storage, tools/search, retries и verification. Оценка и actual billing различаются; unknown actual cost остаётся pending, не 0. Тарифа/оценки верхней границы нет → paid run blocked либо заранее утверждённый ограниченный режим. При угрозе перерасхода остановить новые calls, сохранить checkpoint и сверить ledger; не обещать абсолютный cap внешнего billing без поддержки provider.
AC: concurrent reservations, delayed billing, retry, failed run, exhausted child budget и boundary daily/monthly periods; OTel связывает usage/reservations с task/run. Cost per verified successful task включает все затраты и неудачные попытки.

### Актуальный порядок реализации (заменяет неоднозначное “всё сейчас”)
1. Assurance Graph/staleness — существующий первый slice.
2. Один согласованный contract/fixture slice: Context/Plan, Risk, Presence, Capability lifecycle, Identity, Package, Budget, Sandbox и trace mapping. Схемы ссылаются на общие IDs; не дублируют policy.
3. Synthetic local runtime: enforcement после ADR, scoped credentials, lease/idempotency, budgets и trace; independent verification.
4. Package attestations и второй cloud/CI adapter: equivalent policy tests, checkpoint/resume/cancel и platform compatibility.
5. Scoped product adapter, Model Arena/effort routing; затем persistent scheduling и controlled parallel workers.
P0 означает подготовку контракта, не разрешение немедленного autonomous production execution. Текущие pilot/release gates остаются приоритетом.

## Сводная корректировка по сигналам 30 сентября — 1 октября, записана 2026-10-02

Статус: PLANNED. Расширение существующих ROMA-INC/EVAL/OBS, GROW-MODEL-ARENA и ROMA-PAR; прежние task IDs и gates сохраняются. Ниже актуальная очередь новых slices. Новости о Dots, OpenClaw Enterprise, CoreWeave, моделях и регуляторах — непроверенные research inputs, не зависимости и не юридические требования.

| ID | Связь / порядок | Deliverable и критерии приёмки |
|---|---|---|
| GROW-OBSERVER-003 | GROW-IDENTITY-001 + ROMA-OBS; P0 schema, P1 read-only pilot | Project Observer получает разрешённые CI/PR/task/runtime события; нормализует event_id, source, tenant/project, event_time/received_at, repo/ref/SHA, run/check identity, payload digest и trust status. Webhook signature/source authentication, дедупликация, replay protection, bounded polling/backoff, stale/out-of-order events и quota проверены. Нет запуска из недоверенного текста события. |
| GROW-SCHEDULER-004 | ROMA-PAR-001 + Observer; P0 state machine, P1 single-worker pilot; parallel later | Event-driven Task DAG: dependencies/write sets, durable state, lease/fencing, aggregate budgets и resume queue. Task states READY/RUNNING/WAITING_CI/WAITING_APPROVAL/BLOCKED/FAILED/CANCELLED/DONE. При WAITING_CI worker освобождается для независимой авторизованной задачи; CI событие возвращает старую задачу в очередь, а не автоматически в DONE/merge. |
| ROMA-FAIL-003 | ROMA-INC-001 + ROMA-EVAL/OBS; P0 schema, P1 offline report | Failure Intelligence: failure_id, package/model/tool/capability versions, task class, environment, evidence/trace signature, severity, failure class, suspected cause/confidence, candidate fix, regression refs, resolved_by_version. Cluster/association — гипотеза, не доказанная причинность. Повторяющиеся failures группируются с сохранением отдельных runs и denominator. |
| ROMA-CORPUS-004 | ROMA-FAIL-003 + existing Model Arena; P1 после privacy/trace contracts | Continuous Agent Evaluation: sanitized/replayable tasks и human corrections → versioned eval corpus → controlled candidate runs → independent verdict → reviewed promotion. Единственный eval framework, не вторая Arena. Работает offline, без доступа к production endpoints и credentials. |
| GROW-ADOPT-SPIKE-005 | До дублирования generic control-plane code; TIMEBOXED RESEARCH | Build-vs-adopt matrix для кандидата OpenClaw Enterprise и альтернатив: identity/lifecycle, tenancy, permissions, sandbox, OTel, durable tasks/events/DAG, budgets, upgrade/revocation и audit. Проверить официальный repo, license конкретного commit, maintenance, supply chain, export/exit path и совместимость. Результат ADR: adopt adapter / reuse parts / build; никаких installs/deploys vendor stack по новости. |

### Proactive background contract и Cursor CI workflow
Background по умолчанию READ/ANALYZE/PROPOSE в разрешённом project scope и budget. Branch edits, запуск кода/tests, external writes и remediation имеют side effects и требуют существующего bounded task authorization + plan/policy checks. Уже разрешённый low-risk branch slice может продолжаться без повторного вопроса после каждого шага; production/merge/store и внешние сообщения не получают разрешение от CI GREEN.
AC scheduler: GREEN принимается только для expected repo/head SHA и актуального required-check set; событие старого commit, повтор webhook, check-name spoofing, superseded run и out-of-order update не закрывают task. После restart lease истекает безопасно, задача не исполняется дважды. Failure/timeout/cancel имеют bounded retries и escalation, WAITING_APPROVAL не занимает worker. Dependent задачи остаются blocked до проверенного prerequisite; независимые выполняются в отдельных workspaces без конфликтов.
Первый pilot — synthetic CI events + один worker. Parallel workers включаются позднее после conflict/integration tests и runtime isolation. Изменение DAG/policy после approval требует revalidation.

### Failure → improvement governance
Pipeline: sanitized trace → reviewed failure label/cluster → root-cause hypothesis → proposed remediation plan → candidate branch/package → replay/regression + holdout → independent review → controlled promotion.
Не делать self-modifying/self-deploying ROMA. Immutable verifier N и фиксированный regression corpus проверяют candidate N+1; доверенная deterministic contract suite и независимый reviewer дополняют оценку старой модели. Executor/candidate verifier не меняет rubric, corpus или своё approval. Предыдущая версия доступна для rollback; изменение policy, eval или signer — отдельный scoped review.
AC: fix закрывает целевой regression без ухудшения guard/privacy/other AC; spoofed trace, incomplete audit и неверные labels не становятся trusted PASS. Повторный incident после “resolved” открывает revalidation, а не стирает историю. Production failure не запускает production hotfix без gates.

### Eval corpus и routing evidence
Сохранять task/AC/baseline SHA, package/runtime/policy/model versions, artifact lineage, expected checks и redacted observations. Production data не копируются в git: consent/legal access, tenant isolation, retention/delete и sanitization до export обязательны. Если sanitized replay теряет смысл — synthetic equivalent или restricted evaluation с explicit policy, не утечка оригинала.
Replay замораживает tool results/data cutoffs, не повторяет orders/messages/DB writes. Fixtures выполняются только в disposable sandbox. Train/tuning/regression/holdout разделены по времени/проектам/родственным задачам; corpus digest/version фиксированы, duplicates и contamination проверены. Human label — review signal с confidence/disagreement, не безусловная truth.
Metrics: verified success, defects/severity, policy violations, latency, tokens, retries, rework/human interventions, total cost и corpus coverage. Router получает только reviewed versioned reports; promotion не автоматическое и failure set не заменяет representative task sampling.
GPT-6.1 Sol, Sonnet 5.5, Opus 5.5 и current Cursor runtime — research shortlist из переписки. Перед eval подтвердить реальные model IDs/availability/data policy/цену; не hardcode и не менять default. CoreWeave — later optional runtime backend spike через GROW-RUNTIME-002; claims GA/performance не проверены.

### Актуальная очередь для Cursor
1. Fresh repo/pilot gap audit и первый Assurance Graph/staleness slice.
2. Общие contract fixtures: предыдущие identity/package/budget/security contracts + Observer/DAG/Failure schema.
3. Read-only Observer, synthetic CI scheduler и offline Failure report; bounded branch work по существующим permissions.
4. Sanitized corpus/replay внутри existing Arena; adopt spike до новых generic runtime services.
5. Independent candidate promotion; затем второй sandbox backend и controlled parallel/persistent scheduling.
Запись этой очереди не запускает background workers и не объявляет security/runtime реализованными.

## Уточнения за 2–3 октября — записано 2026-10-03
Все пункты PLANNED, дополняют существующие contracts. Названия Argon/MAI, Apple changes и внешние benchmark/ценовые claims из дайджестов не проверены. Эти сигналы не означают approved vendor dependency.

### GROW-ROUTING-006 — Capability Routing Matrix
P0 eval schema; P1 offline analysis, родитель existing Model Arena/ROMA-CORPUS-004.
Единица сравнения: task_class/fingerprint × executor/model version × runtime × verifier/version × toolset/package/policy. Сохранять baseline SHA, corpus split/version, risk/effort, verified result/defects, violations, retries, elapsed time, tokens/total cost и human rework.
AC: routing report учитывает failed/aborted runs и uncertainty/sample size; недоступная модель/невалидный verifier не выбирается; mixed-risk задача получает обязательный verification level. Holdout и одинаковые permissions/budgets обязательны; model family diversity — полезная дополнительная проверка, не доказательство независимости. Verifier не получает execution credentials и не утверждает свои изменения.
Promotion router rules только через reviewed versioned evidence; unknown task class — conservative permitted fallback либо blocked, без permission escalation. Argon — кандидат offline/security evaluation только после подтверждения доступности, API/data policy и approved capability.

### GROW-BUDGET-001 — reasoning budget уточнение
Добавить max_reasoning_tokens (если provider exposes), max_output_tokens, max_wall_clock, max_model_calls/tool_steps/retries и max_no_progress_cycles. Limиты на task + aggregate children; счётчики не сбрасываются при checkpoint/retry/provider switch.
Скрытые reasoning tokens не выдумывать: unavailable + доступные usage/time/cost proxy. Бюджет поддерживает безопасный stop/checkpoint и escalation; timeout после side effect требует reconciliation.
Не суммировать tokens + seconds + euros как величины одинаковой размерности. Reasoning efficiency — отдельно verified-success per token/cost/time и Pareto comparison по task class; denominator/quality rubric фиксировать. Длинный output сам по себе не quality.
AC: runaway loop, slow provider, cache/token accounting, unknown usage и exhausted budget прекращают новые calls; обязательные checks нельзя отменить для экономии.

### GROW-HOST-007 — HostCapabilityPolicy
P0 contract/negative fixtures, P1 runtime enforcement; расширение ROMA-SANDBOX-002, не отдельная permission система.
Default deny outside approved workspace: mail/messages/browser cookies/keychain/private SSH keys/full disk. Allowed workspace read/write, git/tests — scoped capabilities с subprocess/network constraints, не unrestricted shell.
Task-bound grants содержат canonical paths/resource, operations, actor/run, expiry и policy digest. Read-only repo не даёт автоматически access к домашнему каталогу, symlink target, process env, SSH agent, local sockets/metadata или Xcode signing secrets.
AC: traversal/symlink/mount escape, inherited env/credential helper/subprocess, browser profile access и grants expiry проверены. Runtime должен физически обеспечивать policy; unsupported controls → fail closed, просьба “не читать” не enforcement. Существующие platform permissions не меняются этим docs update. iOS signing/build при необходимости идут через отдельный approved runner/capability.

### GROW-SECRETS-008 — Secret Broker / ephemeral credentials
P0 schema, P1 synthetic broker, затем provider adapters; родитель GROW-RUNTIME-002 + PresenceProof.
Agent запрашивает действие (repo push, preview deploy), broker проверяет identity/capability/risk/project/environment/TTL и выдаёт operation-bound execution grant. Предпочтительно broker выполняет privileged call без раскрытия secret worker. Если provider не поддерживает узкие/короткие токены, broker обеспечивает scope/revocation/proxy; не заявлять вымышленную нативную granularity.
Secret values отсутствуют в package/checkpoint/prompt/trace/git; runtime injection ограничена процессом и revoke/expiry. Production secret.read deny; разрешённый deploy — отдельный broker action с artifact SHA, approvals и PresenceProof.
AC: wrong repo/account/env/action, revoked identity, stale proof, token replay, logging/error leaks и broker outage блокируют операцию. Bootstrap/rotation broker secrets в trusted store; agent не читает их. Новый paid/external action не получает права от существующего local grant.

### ROMA-DRIFT-005 — declared/granted/observed capabilities
P1, внутри Continuous Evaluation/ROMA-TRACE/FAIL. Сравнивать package declaration, effective session grants, broker decisions и достоверные OS/network/tool observations; attempted denied call отличается от successful access.
Функциональный PASS + подтверждённый unauthorized access → capability FAIL, общий verdict FAIL. Недостаточная telemetry coverage → UNKNOWN/INCOMPLETE, не clean PASS. Broker-only trace не доказывает отсутствие host bypass.
AC: undeclared read/network/subprocess и outside-workspace access обнаруживаются; redacted evidence сохраняет resource class без sensitive payload. Unused grant → least-privilege recommendation с sample/window/coverage, не автоматическое снятие permission. Изменение grant policy идёт через reviewed tests и прежние gates.

### Очередь Cursor
Сначала текущие Assurance Graph и product P0. В contract slice добавить routing/reasoning/host/broker schemas; synthetic enforcement и drift fixtures после approved runtime ADR. Затем offline Arena report и reviewed routing rules. Observer/DAG/Failure/Corpus порядок из 2026-10-02 сохранён; не запускать autonomous production agents этим планом.
