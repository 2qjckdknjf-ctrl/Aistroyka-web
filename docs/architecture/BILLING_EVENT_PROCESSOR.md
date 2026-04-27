# Billing Event Processor (Step 14)

**Purpose:** Canonical event processing pipeline. Translation boundary, reconciliation rules, idempotency. Provider-agnostic.

## Model

### BillingTranslatedEvent

Provider-agnostic canonical event shape:

- `providerKind`, `providerEventRef`, `eventType`
- `workspaceId`, `checkoutSessionId`, `subscriptionId`, `targetPlanCode`
- `occurredAt`, `payload`, `reconciliationHint`

### BillingEventProcessingResult

- `status`: `processed` | `skipped` | `failed` | `noop`
- `eventId`, `updatedSubscriptionId`, `updatedCheckoutSessionId`
- `notes`, `idempotentHit`, `error?`

### Reconciliation hints

- `checkout_complete` — sessionId, planCode, billingCycle
- `checkout_cancel` — sessionId
- `subscription_activate` — workspaceId, planCode, billingCycle
- `subscription_cancel` — workspaceId (optional when providerSubscriptionRef present), providerSubscriptionRef (for lookup)
- `subscription_pause` — workspaceId (optional)

## Translation boundary

- **Input:** Raw event record + adapter
- **Output:** `BillingTranslatedEvent` or null (unsupported / skipProcessing)
- **Function:** `translateBillingEventWithAdapter(event, adapter)`
- Adapter `translateProviderEvent` returns `AdapterEventTranslationResult`; processor maps to canonical shape

## Processor entrypoints

- `processBillingEventRecord(supabase, eventId, adapter?)` — single event
- `processPendingBillingEvents(supabase, limit?)` — batch pending
- `processTranslatedBillingEvent(supabase, event, translated)` — direct (testing)
- **Step 19:** `reprocessBillingEvent(supabase, eventId)` — reprocess single; idempotent for processed/skipped; resets failed to pending then processes
- **Step 19:** `processPendingBillingEventsForWorkspace(supabase, workspaceId, opts?)` — reprocess pending/failed for workspace only

## Reconciliation rules

| Hint | Session | Subscription |
|------|---------|--------------|
| checkout_complete | status → completed | Create if none (active) |
| checkout_cancel | status → cancelled | Unchanged |
| subscription_activate | — | Create or update to active |
| subscription_cancel | — | status → cancelled, endedAt set |
| subscription_pause | — | status → paused |

- **Missing session/subscription:** checkout_complete/cancel with missing session → failed
- **Already in target state:** idempotentHit, status processed
- **Unsupported event type:** skipped

## Idempotency policy

1. **Event-record level:** `processing_status !== "pending"` → noop, idempotentHit
2. **Reconciliation level:** Target state already matches → idempotentHit, no duplicate subscription
3. **providerEventRef:** Used for dedupe at ingestion; processor does not re-process same record

## Provider-ready boundary

- **Provider adapter** translates raw webhook/event → `AdapterEventTranslationResult`
- **Processor** maps to `BillingTranslatedEvent` and applies reconciliation
- **Stripe webhook (Step 17):** Real provider webhook feeds canonical processor via `ingestStripeWebhook` → record → `processBillingEventRecord`
- **Slot:** `BillingProviderAdapter.translateProviderEvent` optional method

## Real provider webhook flow (Step 17)

1. **Ingress:** `POST /api/v1/billing/webhooks/stripe` receives raw Stripe event
2. **Verify:** Signature verification (raw body + webhook secret)
3. **Record:** Create `billing_readiness_events` with `provider_event_ref` (idempotent)
4. **Process:** Call `processBillingEventRecord` — same path as sandbox
5. **Reconciliation:** Provider-agnostic; no provider-specific logic in processor

## Internal entrypoints

- Sandbox complete/cancel: record event → `processBillingEventRecord`
- Stripe webhook: verify → record → `processBillingEventRecord`
- Admin: `POST /api/v1/admin/billing/process-pending-events` (admin:write)

## Safety

- Webhook ingress controlled by flag. Default OFF.
- No payment capture in processor.
- No access enforcement changes.
- Processor is internal; no user-facing "process payment" action.

## Operator-facing expectations (Step 20)

- **Processed event:** `processing_status` = `processed`; checkout session or subscription updated per reconciliation rules.
- **Failed event:** `processing_status` = `failed`; `error_info` contains reason. Use `POST /api/v1/admin/billing/reprocess-event` to retry.
- **Pending event:** May indicate webhook received but not yet processed; or reprocess reset. Use `POST /api/v1/admin/billing/reprocess-workspace-events` to process.
- **E2E verification:** See `getBillingPilotExecutionStatus` and `docs/ops/BILLING_PILOT_RUNBOOK.md` for stage-based operator workflow.
