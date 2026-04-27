# Billing Pilot Rollout (Step 18, Step 19, Step 20)

**Purpose:** Controlled pilot rollout for real billing. Live billing (checkout + webhook) only for an explicitly allowlisted cohort of workspaces. No global rollout. Step 19 adds internal ops tooling. Step 20 adds E2E pilot execution status and runbook.

## E2E pilot execution status model (Step 20)

- **Service:** `getBillingPilotExecutionStatus(supabase, workspaceId)` — aggregates checkout, subscription, events into canonical stage
- **Stages:** `pilot_not_eligible`, `ready_for_checkout`, `checkout_created`, `awaiting_provider_completion`, `webhook_received`, `event_processed`, `subscription_state_updated`, `pilot_verified`, `pilot_needs_attention`, `cancelled`, `failed`
- **Attention reasons:** `checkout_created_no_webhook_timeout`, `webhook_failed_processing`, `subscription_missing_after_checkout`, `failed_events_pending`, etc.
- **Operator actions:** `getBillingPilotOperatorActions(status)` — open_billing_overview, inspect_diagnostics, reprocess_failed_event, reprocess_pending_events, confirm_pilot_cohort, see_adapter_mode
- **Verified policy:** `pilot_verified` = eligible + checkout completed + webhook processed + subscription active. **Does NOT imply access enforcement.** No billing-based access changes.
- **Runbook:** `docs/ops/BILLING_PILOT_RUNBOOK.md`

## Model

### BillingPilotEligibility / BillingPilotDecision

- **liveCheckoutEligible:** Whether live Stripe checkout is allowed for this workspace
- **webhookProcessingEligible:** Whether live webhook events should be processed (mutate billing state) for this workspace
- **mode:** `sandbox` | `provider_stub` | `provider_live`
- **reason:** Why the decision was made (e.g. `workspace_not_allowlisted`, `workspace_allowlisted`, `pilot_cohort_eligible`)
- **inPilotCohort:** Whether workspace is in the pilot allowlist

### BillingPilotReason

- `feature_flag_disabled` — global provider flag OFF
- `provider_config_invalid` — Stripe config invalid
- `workspace_not_allowlisted` — workspace not in pilot cohort
- `workspace_allowlisted` — workspace in cohort (used when eligible)
- `missing_workspace` — workspace ID missing or empty
- `webhook_ingress_disabled` — global webhook flag OFF
- `live_checkout_disabled` — global live checkout flag OFF
- `pilot_cohort_eligible` — all checks pass

## Allowlist (Step 18, Step 19)

- **Hybrid:** DB table `billing_pilot_workspaces` first; env `BILLING_PILOT_WORKSPACE_IDS` fallback
- **DB (Step 19):** `workspace_id`, `live_checkout_enabled`, `webhook_processing_enabled`, `cohort_label`, `notes`, `enabled_by`, `created_at`, `updated_at`
- **Env:** `BILLING_PILOT_WORKSPACE_IDS` — comma-separated workspace (tenant) UUIDs
- **Repository:** `getWorkspacePilotStatus(supabase, workspaceId)` — DB first, then env
- **Sync variant:** `isWorkspaceInPilotCohortSync(workspaceId)` — env only (no DB)

## Internal cohort management (Step 19)

- **Add:** `POST /api/v1/admin/billing/pilot-workspaces` — body `{ workspaceId, liveCheckoutEnabled?, webhookProcessingEnabled?, cohortLabel?, notes? }`
- **Remove:** `DELETE /api/v1/admin/billing/pilot-workspaces/:workspaceId` — DB only; env unchanged
- **List:** `GET /api/v1/admin/billing/pilot-workspaces` — DB + env combined
- **Ops service:** `addWorkspaceToPilotCohort`, `removeWorkspaceFromPilotCohort`, `updateBillingPilotWorkspace`

## Resolution service

- **`resolveBillingPilotEligibility(supabase, workspaceId)`** — combines global flags, config, and cohort
- **`getBillingPilotDiagnostics(supabase, workspaceId)`** — full diagnostics for admin
- **`resolveLiveBillingModeForWorkspace(supabase, workspaceId)`** — mode only, for checkout path

Decision order:

1. Missing workspace → `missing_workspace`, sandbox
2. Feature flag disabled → `feature_flag_disabled`, sandbox
3. Config invalid → `provider_config_invalid`, sandbox
4. Workspace not allowlisted → `workspace_not_allowlisted`, provider_stub
5. Live checkout disabled → `live_checkout_disabled`, provider_stub
6. All pass → `pilot_cohort_eligible`, provider_live

## Checkout / webhook coherence

- **Checkout:** `billing-readiness.service` calls `resolveBillingPilotEligibility` before creating checkout; passes `liveCheckoutEligible` to adapter. If false, Stripe adapter returns stub.
- **Webhook:** `stripe-webhook-ingress.service` resolves workspace from event metadata, calls `resolveBillingPilotEligibility`; if `webhookProcessingEligible` false, records event but skips `processBillingEventRecord` (no mutation).
- **Guarantee:** Workspace not in pilot → no live checkout and no live webhook processing.

## Diagnostics

- **Global:** `GET /api/v1/admin/billing/provider-status` — provider config, flags, price mapping
- **Workspace-scoped:** `GET /api/v1/admin/billing/pilot-status?workspaceId=...` — inPilotCohort, liveCheckoutEligible, webhookProcessingEligible, mode, reason
- **Workspace full (Step 19):** `GET /api/v1/admin/billing/workspace-status?workspaceId=...` — checkout, subscription, event counts, last failure, recent events
- **Billing overview:** Readiness flags may include `inPilotCohort`, `pilotReason`, `checkoutMode` for user-facing (calm copy)

## Reprocess / recovery (Step 19)

- **Single event:** `POST /api/v1/admin/billing/reprocess-event` — body `{ eventId }`. Idempotent for already-processed; resets failed to pending then processes.
- **Workspace events:** `POST /api/v1/admin/billing/reprocess-workspace-events` — body `{ workspaceId, includeFailed?, limit? }`. Processes pending and optionally failed events for that workspace only.
- **Internal:** No user-facing "fix my billing" button.

## Internal UI (Step 19, Step 20)

- **Page:** `/[locale]/admin/billing-pilot` — workspace lookup, diagnostics (including E2E stage, suggested action, attention reasons), cohort list, add/remove pilot, reprocess events
- **Admin-only:** No public self-serve activation

## Non-goals

- No global live billing rollout
- No paywall enforcement
- No billing-based access changes
- No invoice/tax logic
- No public self-serve live billing activation
