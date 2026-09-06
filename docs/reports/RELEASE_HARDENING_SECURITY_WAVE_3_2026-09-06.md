# AISTROYKA Release Hardening — Security Wave 3

Date: 2026-09-06
Logical dependency: Security Wave 2 / PR #285
Tracking: #282

## Scope

No product features. This wave closes the remaining confirmed #216-class direct-PostgREST bypasses for client decisions/discussions and internal cost/estimate-result rows, while preserving legitimate stakeholder response paths through server-only writers.

## Confirmed current-main findings

### Client decision rows/events writable through broad internal-reader policies

Current `project_client_requests` / events write policies derive from the internal-reader cohort. This permits direct authenticated mutation outside the app-level `canManageClientRequests` gate.

Fix:
- route authorized stakeholder responses through `getAdminClient()` after tenant/stakeholder authorization;
- fail closed with 503 when the server writer is unavailable;
- manager-side direct RLS writes require `can_manage_project_membership` plus project/tenant consistency;
- request events use the same manage cohort.

### Customer-estimate linked decision must use the same trusted writer

A customer estimate may call `respondToClientRequest` for its linked decision request. After tightening client-request RLS, using the user-scoped client would either fail or encourage permissive stakeholder write policies.

Fix:
- acquire server writer after `canRespondToClientRequests`;
- linked decision, estimate status/timestamps, and commercial-item creation all use that server writer;
- absence of service writer is explicit fail-closed behavior.

### Stakeholder discussion row mutation bypass

Broad internal write policy allows users outside the manager cohort to mutate discussion row state. Legitimate portal status transitions are already server-side/service-role after stakeholder policy checks.

Fix:
- discussion row insert/update/delete require `can_manage_project_membership` and tenant/project consistency where applicable.

### Cost items / estimate results viewer bypass and tenant-project skew

`project_cost_items` and `project_estimate_results` write policies allow the reader cohort on current main.

Fix:
- use `is_internal_tenant_writer_for_tenant` (owner/admin/member, excluding viewer/stakeholder);
- require `project_belongs_to_tenant` on inserts/updates.

## Migration

`20260906113000_harden_client_requests_costs_estimate_writes.sql`

## Regression coverage

- `lib/tenant/client-requests-costs-estimate-rls.hardening.test.ts`
- `lib/tenant/customer-decision-service-writer.contract.test.ts`
- updated `lib/domain/customer-estimates/customer-estimates.service.test.ts`

## Dependency / review strategy

Wave 3 is stacked on the exact Wave 2 head. Review this PR only as the delta against `release-hardening/security-wave-2`.

Do not merge Wave 3 before Wave 1 and Wave 2 are accepted. After lower waves land on `main`, rebase/retarget and rerun validation on the resulting exact SHA.

## Required gates

- clean Wave 3-only diff;
- exact-head CI green;
- no unresolved P0/P1 review findings;
- current staging/prod policy-name/schema compatibility before migration apply;
- negative direct-REST checks for viewer/member decision/discussion writes and viewer cost/estimate-result writes;
- positive stakeholder client-request respond and estimate approval/rejection flow using service writer;
- positive manager client-request/discussion and member cost operations according to intended role model;
- no production mutation in this PR.
