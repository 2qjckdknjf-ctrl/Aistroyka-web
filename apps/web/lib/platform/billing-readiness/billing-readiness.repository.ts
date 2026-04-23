/**
 * Billing readiness repository layer (Step 12).
 * Data access for billing_readiness_* tables.
 * Writes require service_role (admin client).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanCode } from "@aistroyka/contracts";
import type {
  BillingCustomer,
  BillingSubscription,
  BillingCheckoutSession,
  BillingEvent,
  TrialState,
  BillingSubscriptionStatus,
  BillingCheckoutSessionStatus,
  BillingProviderKind,
  BillingCycle,
  BillingEventProcessingStatus,
  TrialStatus,
} from "./billing-readiness.types";

// ─── Row types ──────────────────────────────────────────────────────────────

interface BillingCustomerRow {
  workspace_id: string;
  provider_customer_ref: string | null;
  billing_email: string | null;
  status: string;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface BillingSubscriptionRow {
  id: string;
  workspace_id: string;
  canonical_plan_code: string;
  billing_provider: string;
  provider_subscription_ref: string | null;
  status: string;
  billing_cycle: string;
  trial_status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BillingCheckoutSessionRow {
  id: string;
  workspace_id: string;
  target_plan_code: string;
  requested_billing_cycle: string;
  status: string;
  provider_session_ref: string | null;
  return_url: string;
  cancel_url: string;
  created_by_user_id: string | null;
  created_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
}

interface BillingEventRow {
  id: string;
  workspace_id: string | null;
  billing_provider: string;
  provider_event_ref: string | null;
  event_type: string;
  event_payload_snapshot: Record<string, unknown>;
  processing_status: string;
  processed_at: string | null;
  received_at: string;
  error_info: string | null;
}

interface TrialStateRow {
  id: string;
  workspace_id: string;
  kind: string;
  status: string;
  started_at: string;
  ends_at: string;
  source: string;
  trial_plan_code: string;
  converted_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Customers ──────────────────────────────────────────────────────────────

export async function getBillingCustomerByWorkspace(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BillingCustomer | null> {
  const { data, error } = await supabase
    .from("billing_readiness_customers")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToCustomer(data as BillingCustomerRow);
}

export async function upsertBillingCustomer(
  supabase: SupabaseClient,
  input: {
    workspaceId: string;
    providerCustomerRef?: string | null;
    billingEmail?: string | null;
    status?: string;
    meta?: Record<string, unknown>;
  }
): Promise<{ data: BillingCustomer | null; error: string | null }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("billing_readiness_customers")
    .upsert(
      {
        workspace_id: input.workspaceId,
        provider_customer_ref: input.providerCustomerRef ?? null,
        billing_email: input.billingEmail ?? null,
        status: input.status ?? "none",
        meta: input.meta ?? {},
        updated_at: now,
      },
      { onConflict: "workspace_id" }
    )
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: rowToCustomer(data as BillingCustomerRow), error: null };
}

// ─── Subscriptions ──────────────────────────────────────────────────────────

export async function createBillingSubscription(
  supabase: SupabaseClient,
  input: {
    workspaceId: string;
    canonicalPlanCode: PlanCode;
    billingProvider: BillingProviderKind;
    providerSubscriptionRef?: string | null;
    status?: BillingSubscriptionStatus;
    billingCycle?: BillingCycle;
    trialStatus?: TrialStatus | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  }
): Promise<{ data: BillingSubscription | null; error: string | null }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("billing_readiness_subscriptions")
    .insert({
      workspace_id: input.workspaceId,
      canonical_plan_code: input.canonicalPlanCode,
      billing_provider: input.billingProvider,
      provider_subscription_ref: input.providerSubscriptionRef ?? null,
      status: input.status ?? "unknown",
      billing_cycle: input.billingCycle ?? "monthly",
      trial_status: input.trialStatus ?? null,
      current_period_start: input.currentPeriodStart ?? null,
      current_period_end: input.currentPeriodEnd ?? null,
      cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
    })
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: rowToSubscription(data as BillingSubscriptionRow), error: null };
}

export async function getCurrentBillingSubscription(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BillingSubscription | null> {
  const { data, error } = await supabase
    .from("billing_readiness_subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("ended_at", null)
    .in("status", ["pending", "trialing", "active", "past_due", "incomplete", "paused"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToSubscription(data as BillingSubscriptionRow);
}

export async function updateBillingSubscriptionStatus(
  supabase: SupabaseClient,
  subscriptionId: string,
  status: BillingSubscriptionStatus,
  extra?: { endedAt?: string | null }
): Promise<{ data: BillingSubscription | null; error: string | null }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("billing_readiness_subscriptions")
    .update({
      status,
      ended_at: extra?.endedAt ?? undefined,
      updated_at: now,
    })
    .eq("id", subscriptionId)
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: rowToSubscription(data as BillingSubscriptionRow), error: null };
}

// ─── Checkout sessions ──────────────────────────────────────────────────────

export async function createBillingCheckoutSession(
  supabase: SupabaseClient,
  input: {
    workspaceId: string;
    targetPlanCode: PlanCode;
    requestedBillingCycle: BillingCycle;
    returnUrl: string;
    cancelUrl: string;
    createdByUserId?: string | null;
    expiresAt?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<{ data: BillingCheckoutSession | null; error: string | null }> {
  const { data, error } = await supabase
    .from("billing_readiness_checkout_sessions")
    .insert({
      workspace_id: input.workspaceId,
      target_plan_code: input.targetPlanCode,
      requested_billing_cycle: input.requestedBillingCycle,
      status: "created",
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      created_by_user_id: input.createdByUserId ?? null,
      expires_at: input.expiresAt ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: rowToCheckoutSession(data as BillingCheckoutSessionRow), error: null };
}

export async function getBillingCheckoutSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<BillingCheckoutSession | null> {
  const { data, error } = await supabase
    .from("billing_readiness_checkout_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToCheckoutSession(data as BillingCheckoutSessionRow);
}

export async function updateBillingCheckoutSessionStatus(
  supabase: SupabaseClient,
  sessionId: string,
  status: BillingCheckoutSessionStatus
): Promise<{ data: BillingCheckoutSession | null; error: string | null }> {
  const { data, error } = await supabase
    .from("billing_readiness_checkout_sessions")
    .update({ status })
    .eq("id", sessionId)
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: rowToCheckoutSession(data as BillingCheckoutSessionRow), error: null };
}

export async function updateBillingCheckoutSessionProviderRef(
  supabase: SupabaseClient,
  sessionId: string,
  providerSessionRef: string
): Promise<{ data: BillingCheckoutSession | null; error: string | null }> {
  const { data, error } = await supabase
    .from("billing_readiness_checkout_sessions")
    .update({ provider_session_ref: providerSessionRef })
    .eq("id", sessionId)
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: rowToCheckoutSession(data as BillingCheckoutSessionRow), error: null };
}

export async function getBillingCheckoutSessionByProviderRef(
  supabase: SupabaseClient,
  providerSessionRef: string
): Promise<BillingCheckoutSession | null> {
  const { data, error } = await supabase
    .from("billing_readiness_checkout_sessions")
    .select("*")
    .eq("provider_session_ref", providerSessionRef)
    .maybeSingle();
  if (error || !data) return null;
  return rowToCheckoutSession(data as BillingCheckoutSessionRow);
}

/**
 * Get latest checkout session for workspace (Step 19 ops).
 */
export async function getLatestBillingCheckoutSessionByWorkspace(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BillingCheckoutSession | null> {
  const { data, error } = await supabase
    .from("billing_readiness_checkout_sessions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToCheckoutSession(data as BillingCheckoutSessionRow);
}

/**
 * Get billing events for workspace (Step 19 ops).
 */
export async function getBillingEventsByWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  opts?: { limit?: number; statuses?: BillingEventProcessingStatus[] }
): Promise<BillingEvent[]> {
  const limit = Math.min(opts?.limit ?? 20, 100);
  let query = supabase
    .from("billing_readiness_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("received_at", { ascending: false })
    .limit(limit);
  if (opts?.statuses?.length) {
    query = query.in("processing_status", opts.statuses);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as BillingEventRow[]).map(rowToEvent);
}

/**
 * Get pending or failed billing events for workspace (Step 19 reprocess).
 */
export async function getUnprocessedBillingEventsForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  includeFailed = true,
  limit = 50
): Promise<BillingEvent[]> {
  const statuses: BillingEventProcessingStatus[] = ["pending"];
  if (includeFailed) statuses.push("failed");
  const { data, error } = await supabase
    .from("billing_readiness_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .in("processing_status", statuses)
    .order("received_at", { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return (data as BillingEventRow[]).map(rowToEvent);
}

/**
 * Get event counts by status for workspace (Step 19 ops).
 */
export async function getBillingEventCountsByWorkspace(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<{ pending: number; processed: number; failed: number; skipped: number }> {
  const { data, error } = await supabase
    .from("billing_readiness_events")
    .select("processing_status")
    .eq("workspace_id", workspaceId);
  if (error || !data) {
    return { pending: 0, processed: 0, failed: 0, skipped: 0 };
  }
  const rows = data as { processing_status: string }[];
  const counts = { pending: 0, processed: 0, failed: 0, skipped: 0 };
  for (const r of rows) {
    if (r.processing_status === "pending") counts.pending++;
    else if (r.processing_status === "processed") counts.processed++;
    else if (r.processing_status === "failed") counts.failed++;
    else if (r.processing_status === "skipped") counts.skipped++;
  }
  return counts;
}

// ─── Events ─────────────────────────────────────────────────────────────────

export async function createBillingEventRecord(
  supabase: SupabaseClient,
  input: {
    workspaceId?: string | null;
    billingProvider: BillingProviderKind;
    providerEventRef?: string | null;
    eventType: string;
    eventPayloadSnapshot?: Record<string, unknown>;
  }
): Promise<{ data: BillingEvent | null; error: string | null }> {
  const { data, error } = await supabase
    .from("billing_readiness_events")
    .insert({
      workspace_id: input.workspaceId ?? null,
      billing_provider: input.billingProvider,
      provider_event_ref: input.providerEventRef ?? null,
      event_type: input.eventType,
      event_payload_snapshot: input.eventPayloadSnapshot ?? {},
      processing_status: "pending",
    })
    .select("*")
    .single();
  if (error) return { data: null, error: error.message };
  return { data: rowToEvent(data as BillingEventRow), error: null };
}

export async function markBillingEventProcessed(
  supabase: SupabaseClient,
  eventId: string,
  status: BillingEventProcessingStatus = "processed",
  errorInfo?: string | null
): Promise<{ error: string | null }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("billing_readiness_events")
    .update({
      processing_status: status,
      processed_at: status === "processed" ? now : undefined,
      error_info: errorInfo ?? undefined,
    })
    .eq("id", eventId);
  return { error: error?.message ?? null };
}

/**
 * Reset event to pending for reprocess (Step 19).
 * Use only for failed events in admin recovery flow.
 */
export async function resetBillingEventToPending(
  supabase: SupabaseClient,
  eventId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("billing_readiness_events")
    .update({
      processing_status: "pending",
      processed_at: null,
      error_info: null,
    })
    .eq("id", eventId);
  return { error: error?.message ?? null };
}

export async function getBillingEventById(
  supabase: SupabaseClient,
  eventId: string
): Promise<BillingEvent | null> {
  const { data, error } = await supabase
    .from("billing_readiness_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToEvent(data as BillingEventRow);
}

export async function getUnprocessedBillingEvents(
  supabase: SupabaseClient,
  limit = 50
): Promise<BillingEvent[]> {
  const { data, error } = await supabase
    .from("billing_readiness_events")
    .select("*")
    .eq("processing_status", "pending")
    .order("received_at", { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return (data as BillingEventRow[]).map(rowToEvent);
}

/**
 * Lookup billing event by provider event ref (Step 17 idempotency).
 * Unique index on (billing_provider, provider_event_ref) ensures dedupe.
 */
export async function getBillingEventByProviderRef(
  supabase: SupabaseClient,
  billingProvider: BillingProviderKind,
  providerEventRef: string
): Promise<BillingEvent | null> {
  const { data, error } = await supabase
    .from("billing_readiness_events")
    .select("*")
    .eq("billing_provider", billingProvider)
    .eq("provider_event_ref", providerEventRef)
    .maybeSingle();
  if (error || !data) return null;
  return rowToEvent(data as BillingEventRow);
}

/**
 * Lookup subscription by provider subscription ref (Step 17).
 * For resolving workspace from Stripe subscription id on subscription.deleted.
 */
export async function getBillingSubscriptionByProviderRef(
  supabase: SupabaseClient,
  providerSubscriptionRef: string
): Promise<BillingSubscription | null> {
  const { data, error } = await supabase
    .from("billing_readiness_subscriptions")
    .select("*")
    .eq("provider_subscription_ref", providerSubscriptionRef)
    .maybeSingle();
  if (error || !data) return null;
  return rowToSubscription(data as BillingSubscriptionRow);
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function rowToCustomer(r: BillingCustomerRow): BillingCustomer {
  return {
    workspaceId: r.workspace_id,
    providerCustomerRef: r.provider_customer_ref,
    billingEmail: r.billing_email,
    status: r.status,
    meta: (r.meta as Record<string, unknown>) ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToSubscription(r: BillingSubscriptionRow): BillingSubscription {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    canonicalPlanCode: r.canonical_plan_code as PlanCode,
    billingProvider: r.billing_provider as BillingProviderKind,
    providerSubscriptionRef: r.provider_subscription_ref,
    status: r.status as BillingSubscriptionStatus,
    billingCycle: r.billing_cycle as BillingCycle,
    trialStatus: r.trial_status as TrialStatus | null,
    currentPeriodStart: r.current_period_start,
    currentPeriodEnd: r.current_period_end,
    cancelAtPeriodEnd: r.cancel_at_period_end,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToCheckoutSession(r: BillingCheckoutSessionRow): BillingCheckoutSession {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    targetPlanCode: r.target_plan_code as PlanCode,
    requestedBillingCycle: r.requested_billing_cycle as BillingCycle,
    status: r.status as BillingCheckoutSessionStatus,
    providerSessionRef: r.provider_session_ref,
    returnUrl: r.return_url,
    cancelUrl: r.cancel_url,
    createdByUserId: r.created_by_user_id,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
  };
}

function rowToEvent(r: BillingEventRow): BillingEvent {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    billingProvider: r.billing_provider as BillingProviderKind,
    providerEventRef: r.provider_event_ref,
    eventType: r.event_type,
    eventPayloadSnapshot: (r.event_payload_snapshot as Record<string, unknown>) ?? {},
    processingStatus: r.processing_status as BillingEventProcessingStatus,
    processedAt: r.processed_at,
    receivedAt: r.received_at,
    errorInfo: r.error_info,
  };
}
