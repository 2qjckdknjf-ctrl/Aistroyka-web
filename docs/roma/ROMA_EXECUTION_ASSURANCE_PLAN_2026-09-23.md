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

