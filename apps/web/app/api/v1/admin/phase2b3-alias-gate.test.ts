/**
 * Phase 2B.3 — direct handler proofs for deprecated admin billing/leads aliases.
 * Proves: canonical delegation, deprecation headers, handler-level deny without mutation,
 * write mode OWNER_READONLY block, and allowed write contracts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mockRequirePlatformOwnerApi = vi.fn();
const mockGetAdminClient = vi.fn();
const mockGetBillingPilotDiagnostics = vi.fn();
const mockListBillingPilotWorkspacesSummary = vi.fn();
const mockAddWorkspaceToPilotCohort = vi.fn();
const mockRemoveWorkspaceFromPilotCohort = vi.fn();
const mockProcessPendingBillingEvents = vi.fn();
const mockReprocessBillingEventOps = vi.fn();
const mockReprocessBillingEventsForWorkspaceOps = vi.fn();
const mockGetBillingPilotWorkspaceDiagnostics = vi.fn();
const mockGetBillingPilotExecutionStatus = vi.fn();
const mockGetBillingPilotOperatorActions = vi.fn();

vi.mock("@/lib/platform-owner/require-platform-owner-api", () => ({
  requirePlatformOwnerApi: (...args: unknown[]) => mockRequirePlatformOwnerApi(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => mockGetAdminClient(...args),
}));

vi.mock("@/lib/platform/billing-readiness/billing-pilot-resolution.service", () => ({
  getBillingPilotDiagnostics: (...args: unknown[]) => mockGetBillingPilotDiagnostics(...args),
}));

vi.mock("@/lib/platform/billing-readiness/billing-pilot-ops.service", () => ({
  listBillingPilotWorkspacesSummary: (...args: unknown[]) => mockListBillingPilotWorkspacesSummary(...args),
  addWorkspaceToPilotCohort: (...args: unknown[]) => mockAddWorkspaceToPilotCohort(...args),
  removeWorkspaceFromPilotCohort: (...args: unknown[]) => mockRemoveWorkspaceFromPilotCohort(...args),
  reprocessBillingEventOps: (...args: unknown[]) => mockReprocessBillingEventOps(...args),
  reprocessBillingEventsForWorkspaceOps: (...args: unknown[]) =>
    mockReprocessBillingEventsForWorkspaceOps(...args),
  getBillingPilotWorkspaceDiagnostics: (...args: unknown[]) =>
    mockGetBillingPilotWorkspaceDiagnostics(...args),
}));

vi.mock("@/lib/platform/billing-readiness/billing-event-processor.service", () => ({
  processPendingBillingEvents: (...args: unknown[]) => mockProcessPendingBillingEvents(...args),
}));

vi.mock("@/lib/platform/billing-readiness/billing-pilot-execution.service", () => ({
  getBillingPilotExecutionStatus: (...args: unknown[]) => mockGetBillingPilotExecutionStatus(...args),
  getBillingPilotOperatorActions: (...args: unknown[]) => mockGetBillingPilotOperatorActions(...args),
}));

vi.mock("@/lib/platform/billing-readiness/billing-adapter-registry", () => ({
  getBillingAdapterDiagnostics: () => ({
    activeAdapterKind: "sandbox",
    providerKind: "stripe",
    flagEnabled: false,
    configValid: false,
    liveCheckoutEnabled: false,
    checkoutMode: "sandbox",
    webhookIngressEnabled: false,
    webhookConfigValid: false,
    fallbackReason: "provider_disabled",
  }),
}));

vi.mock("@/lib/platform/billing-readiness/stripe-price-mapping", () => ({
  getStripePriceMappingDiagnostics: () => ({ starter: null, pro: null }),
}));

vi.mock("@/lib/platform/billing-readiness/billing-provider-config", () => ({
  getStripeWebhookIngressConfig: () => ({ enabled: false, webhookSecretValid: false }),
}));

function ownerOk(role: "OWNER" | "OWNER_READONLY" | "OWNER_OPERATOR" = "OWNER") {
  return { ok: true as const, supabase: {}, userId: "u1", role };
}

function ownerDeny(status: number, code: string) {
  return {
    ok: false as const,
    response: NextResponse.json({ error: "forbidden", code }, { status }),
  };
}

/** Unique 429 used for route-level preservation proofs (GET + write aliases). */
function ownerDeny429(nonce: string) {
  const payload = {
    error: "rate_limited",
    code: "owner_rate_limited",
    nonce,
  };
  const bodyText = JSON.stringify(payload);
  return {
    ok: false as const,
    bodyText,
    payload,
    response: new NextResponse(bodyText, {
      status: 429,
      statusText: "Too Many Requests",
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "42",
        "X-Rate-Limit-Scope": "platform-owner",
      },
    }),
  };
}

function expectDeprecation(res: Response, canonicalSuffix: string) {
  expect(res.headers.get("Deprecation")).toBe("true");
  expect(res.headers.get("Link")).toContain(`/api/v1/platform${canonicalSuffix}`);
  expect(res.headers.get("Link")).toContain('rel="successor-version"');
}

describe("Phase 2B.3 admin alias handler defense + deprecation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePlatformOwnerApi.mockResolvedValue(ownerOk("OWNER"));
    mockGetAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "lead-1",
            created_at: "2026-01-01",
            name: "A",
            email: "a@example.com",
            company: null,
            message: null,
            source: "contact_form",
            status: "new",
            notes: null,
          },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      })),
    });
    mockGetBillingPilotDiagnostics.mockResolvedValue({
      workspaceId: "w1",
      inPilotCohort: true,
      liveCheckoutEligible: true,
      webhookProcessingEligible: true,
      mode: "provider_live",
      reason: "workspace_allowlisted",
      globalProviderEnabled: true,
      globalLiveCheckoutEnabled: true,
      globalWebhookIngressEnabled: true,
      configValid: true,
    });
    mockListBillingPilotWorkspacesSummary.mockResolvedValue([{ workspaceId: "w1" }]);
    mockAddWorkspaceToPilotCohort.mockResolvedValue({
      data: { workspace_id: "11111111-1111-1111-1111-111111111111" },
      error: null,
    });
    mockRemoveWorkspaceFromPilotCohort.mockResolvedValue({ error: null });
    mockProcessPendingBillingEvents.mockResolvedValue([]);
    mockReprocessBillingEventOps.mockResolvedValue({ ok: true, eventId: "e1" });
    mockReprocessBillingEventsForWorkspaceOps.mockResolvedValue([]);
    mockGetBillingPilotWorkspaceDiagnostics.mockResolvedValue({ workspaceId: "w1" });
    mockGetBillingPilotExecutionStatus.mockResolvedValue({ status: "idle" });
    mockGetBillingPilotOperatorActions.mockReturnValue([]);
  });

  it("GET alias /admin/billing/pilot-status success + deprecation + read mode", async () => {
    const { GET } = await import("./billing/pilot-status/route");
    const res = await GET(
      new Request("https://x/api/v1/admin/billing/pilot-status?workspaceId=w1")
    );
    expect(res.status).toBe(200);
    expectDeprecation(res, "/billing/pilot-status");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
    expect(mockGetBillingPilotDiagnostics).toHaveBeenCalled();
    const body = await res.json();
    expect(body.workspaceId).toBe("w1");
  });

  it("GET alias /admin/billing/pilot-status handler 403 without business call", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_gate"));
    const { GET } = await import("./billing/pilot-status/route");
    const res = await GET(
      new Request("https://x/api/v1/admin/billing/pilot-status?workspaceId=w1")
    );
    expect(res.status).toBe(403);
    expectDeprecation(res, "/billing/pilot-status");
    expect(mockGetBillingPilotDiagnostics).not.toHaveBeenCalled();
  });

  it("GET alias /admin/billing/pilot-workspaces success + deprecation", async () => {
    const { GET } = await import("./billing/pilot-workspaces/route");
    const res = await GET(new Request("https://x/api/v1/admin/billing/pilot-workspaces"));
    expect(res.status).toBe(200);
    expectDeprecation(res, "/billing/pilot-workspaces");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
    const body = await res.json();
    expect(body.workspaces).toHaveLength(1);
  });

  it("GET alias /admin/billing/pilot-workspaces handler 403 without business call", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_gate"));
    const { GET } = await import("./billing/pilot-workspaces/route");
    const res = await GET(new Request("https://x/api/v1/admin/billing/pilot-workspaces"));
    expect(res.status).toBe(403);
    expectDeprecation(res, "/billing/pilot-workspaces");
    expect(mockListBillingPilotWorkspacesSummary).not.toHaveBeenCalled();
  });

  it("POST alias /admin/billing/pilot-workspaces write success + deprecation", async () => {
    const { POST } = await import("./billing/pilot-workspaces/route");
    const res = await POST(
      new Request("https://x/api/v1/admin/billing/pilot-workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "11111111-1111-1111-1111-111111111111" }),
      })
    );
    expect(res.status).toBe(200);
    expectDeprecation(res, "/billing/pilot-workspaces");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
    expect(mockAddWorkspaceToPilotCohort).toHaveBeenCalled();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("POST alias /admin/billing/pilot-workspaces OWNER_READONLY blocks without mutation", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_readonly"));
    const { POST } = await import("./billing/pilot-workspaces/route");
    const res = await POST(
      new Request("https://x/api/v1/admin/billing/pilot-workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "11111111-1111-1111-1111-111111111111" }),
      })
    );
    expect(res.status).toBe(403);
    expectDeprecation(res, "/billing/pilot-workspaces");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
    expect(mockAddWorkspaceToPilotCohort).not.toHaveBeenCalled();
  });

  it("DELETE alias /admin/billing/pilot-workspaces/:id write success + deprecation", async () => {
    const { DELETE } = await import("./billing/pilot-workspaces/[workspaceId]/route");
    const res = await DELETE(new Request("https://x/api/v1/admin/billing/pilot-workspaces/ws-1", {
      method: "DELETE",
    }), { params: Promise.resolve({ workspaceId: "ws-1" }) });
    expect(res.status).toBe(200);
    expectDeprecation(res, "/billing/pilot-workspaces/[workspaceId]");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
    expect(mockRemoveWorkspaceFromPilotCohort).toHaveBeenCalled();
  });

  it("DELETE alias pilot-workspaces OWNER_READONLY blocks without mutation", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_readonly"));
    const { DELETE } = await import("./billing/pilot-workspaces/[workspaceId]/route");
    const res = await DELETE(new Request("https://x/api/v1/admin/billing/pilot-workspaces/ws-1", {
      method: "DELETE",
    }), { params: Promise.resolve({ workspaceId: "ws-1" }) });
    expect(res.status).toBe(403);
    expect(mockRemoveWorkspaceFromPilotCohort).not.toHaveBeenCalled();
  });

  it("POST alias /admin/billing/process-pending-events write success + deprecation", async () => {
    const { POST } = await import("./billing/process-pending-events/route");
    const res = await POST(new Request("https://x/api/v1/admin/billing/process-pending-events", {
      method: "POST",
    }));
    expect(res.status).toBe(200);
    expectDeprecation(res, "/billing/process-pending-events");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
    expect(mockProcessPendingBillingEvents).toHaveBeenCalled();
  });

  it("POST process-pending-events OWNER_READONLY blocks without mutation", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_readonly"));
    const { POST } = await import("./billing/process-pending-events/route");
    const res = await POST(new Request("https://x/api/v1/admin/billing/process-pending-events", {
      method: "POST",
    }));
    expect(res.status).toBe(403);
    expect(mockProcessPendingBillingEvents).not.toHaveBeenCalled();
  });

  it("GET alias /admin/billing/provider-status success + deprecation", async () => {
    const { GET } = await import("./billing/provider-status/route");
    const res = await GET(new Request("https://x/api/v1/admin/billing/provider-status"));
    expect(res.status).toBe(200);
    expectDeprecation(res, "/billing/provider-status");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
    const body = await res.json();
    expect(body).toHaveProperty("checkoutMode");
  });

  it("GET provider-status handler 401 without business side effects", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(401, "owner_session_refresh_required"));
    const { GET } = await import("./billing/provider-status/route");
    const res = await GET(new Request("https://x/api/v1/admin/billing/provider-status"));
    expect(res.status).toBe(401);
    expectDeprecation(res, "/billing/provider-status");
  });

  it("POST alias /admin/billing/reprocess-event write success + deprecation", async () => {
    const { POST } = await import("./billing/reprocess-event/route");
    const res = await POST(
      new Request("https://x/api/v1/admin/billing/reprocess-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: "e1" }),
      })
    );
    expect(res.status).toBe(200);
    expectDeprecation(res, "/billing/reprocess-event");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
    expect(mockReprocessBillingEventOps).toHaveBeenCalled();
  });

  it("POST reprocess-event OWNER_READONLY blocks without mutation", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_readonly"));
    const { POST } = await import("./billing/reprocess-event/route");
    const res = await POST(
      new Request("https://x/api/v1/admin/billing/reprocess-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: "e1" }),
      })
    );
    expect(res.status).toBe(403);
    expect(mockReprocessBillingEventOps).not.toHaveBeenCalled();
  });

  it("POST alias /admin/billing/reprocess-workspace-events write success + deprecation", async () => {
    const { POST } = await import("./billing/reprocess-workspace-events/route");
    const res = await POST(
      new Request("https://x/api/v1/admin/billing/reprocess-workspace-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "w1" }),
      })
    );
    expect(res.status).toBe(200);
    expectDeprecation(res, "/billing/reprocess-workspace-events");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
    expect(mockReprocessBillingEventsForWorkspaceOps).toHaveBeenCalled();
  });

  it("POST reprocess-workspace-events OWNER_READONLY blocks without mutation", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_readonly"));
    const { POST } = await import("./billing/reprocess-workspace-events/route");
    const res = await POST(
      new Request("https://x/api/v1/admin/billing/reprocess-workspace-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "w1" }),
      })
    );
    expect(res.status).toBe(403);
    expectDeprecation(res, "/billing/reprocess-workspace-events");
    expect(mockReprocessBillingEventsForWorkspaceOps).not.toHaveBeenCalled();
  });

  it("GET alias /admin/billing/workspace-status success + deprecation", async () => {
    const { GET } = await import("./billing/workspace-status/route");
    const res = await GET(
      new Request("https://x/api/v1/admin/billing/workspace-status?workspaceId=w1")
    );
    expect(res.status).toBe(200);
    expectDeprecation(res, "/billing/workspace-status");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
    expect(mockGetBillingPilotWorkspaceDiagnostics).toHaveBeenCalled();
  });

  it("GET alias /admin/billing/workspace-status handler 403 without business call", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_gate"));
    const { GET } = await import("./billing/workspace-status/route");
    const res = await GET(
      new Request("https://x/api/v1/admin/billing/workspace-status?workspaceId=w1")
    );
    expect(res.status).toBe(403);
    expectDeprecation(res, "/billing/workspace-status");
    expect(mockGetBillingPilotWorkspaceDiagnostics).not.toHaveBeenCalled();
  });

  it("GET alias /admin/leads success + deprecation", async () => {
    const { GET } = await import("./leads/route");
    const res = await GET(new Request("https://x/api/v1/admin/leads"));
    expect(res.status).toBe(200);
    expectDeprecation(res, "/leads");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
  });

  it("GET alias /admin/leads handler 403 without query", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_gate"));
    const { GET } = await import("./leads/route");
    const res = await GET(new Request("https://x/api/v1/admin/leads"));
    expect(res.status).toBe(403);
    expectDeprecation(res, "/leads");
    expect(mockGetAdminClient).not.toHaveBeenCalled();
  });

  it("GET alias /admin/leads/:id success + deprecation", async () => {
    const { GET } = await import("./leads/[id]/route");
    const res = await GET(new Request("https://x/api/v1/admin/leads/lead-1"), {
      params: Promise.resolve({ id: "lead-1" }),
    });
    expect(res.status).toBe(200);
    expectDeprecation(res, "/leads/[id]");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "read" });
  });

  it("GET alias /admin/leads/:id handler 403 without business call", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_gate"));
    const { GET } = await import("./leads/[id]/route");
    const res = await GET(new Request("https://x/api/v1/admin/leads/lead-1"), {
      params: Promise.resolve({ id: "lead-1" }),
    });
    expect(res.status).toBe(403);
    expectDeprecation(res, "/leads/[id]");
    expect(mockGetAdminClient).not.toHaveBeenCalled();
  });

  it("PATCH alias /admin/leads/:id write success + deprecation", async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "lead-1",
          created_at: "2026-01-01",
          name: "A",
          email: "a@example.com",
          company: null,
          message: null,
          source: "contact_form",
          status: "reviewed",
          notes: null,
        },
        error: null,
      }),
    };
    mockGetAdminClient.mockReturnValue({ from: vi.fn(() => chain) });
    const { PATCH } = await import("./leads/[id]/route");
    const res = await PATCH(
      new Request("https://x/api/v1/admin/leads/lead-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewed" }),
      }),
      { params: Promise.resolve({ id: "lead-1" }) }
    );
    expect(res.status).toBe(200);
    expectDeprecation(res, "/leads/[id]");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
    expect(chain.update).toHaveBeenCalled();
  });

  it("PATCH alias /admin/leads/:id OWNER_READONLY blocks without mutation", async () => {
    const update = vi.fn();
    mockGetAdminClient.mockReturnValue({ from: vi.fn(() => ({ update })) });
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_readonly"));
    const { PATCH } = await import("./leads/[id]/route");
    const res = await PATCH(
      new Request("https://x/api/v1/admin/leads/lead-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewed" }),
      }),
      { params: Promise.resolve({ id: "lead-1" }) }
    );
    expect(res.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("PATCH alias /admin/leads/bulk write success + deprecation", async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [{ id: "11111111-1111-1111-1111-111111111111", status: "archived", notes: null }],
        error: null,
      }),
    };
    mockGetAdminClient.mockReturnValue({ from: vi.fn(() => chain) });
    const { PATCH } = await import("./leads/bulk/route");
    const res = await PATCH(
      new Request("https://x/api/v1/admin/leads/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: ["11111111-1111-1111-1111-111111111111"],
          status: "archived",
        }),
      })
    );
    expect(res.status).toBe(200);
    expectDeprecation(res, "/leads/bulk");
    expect(mockRequirePlatformOwnerApi).toHaveBeenCalledWith(expect.anything(), { mode: "write" });
    expect(chain.update).toHaveBeenCalled();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("PATCH alias /admin/leads/bulk OWNER_READONLY blocks without mutation", async () => {
    const update = vi.fn();
    mockGetAdminClient.mockReturnValue({ from: vi.fn(() => ({ update })) });
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(ownerDeny(403, "owner_readonly"));
    const { PATCH } = await import("./leads/bulk/route");
    const res = await PATCH(
      new Request("https://x/api/v1/admin/leads/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: ["11111111-1111-1111-1111-111111111111"],
          status: "archived",
        }),
      })
    );
    expect(res.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("POST write-role OWNER still reaches mutation (contract preserved)", async () => {
    mockRequirePlatformOwnerApi.mockResolvedValue(ownerOk("OWNER_OPERATOR"));
    const { POST } = await import("./billing/reprocess-event/route");
    const res = await POST(
      new Request("https://x/api/v1/admin/billing/reprocess-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: "e1" }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockReprocessBillingEventOps).toHaveBeenCalled();
  });

  it("GET alias /admin/billing/pilot-status preserves handler 429 statusText body Retry-After", async () => {
    const deny = ownerDeny429("phase2b3-get-429-nonce");
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(deny);
    const { GET } = await import("./billing/pilot-status/route");
    const res = await GET(
      new Request("https://x/api/v1/admin/billing/pilot-status?workspaceId=w1")
    );
    expect(res.status).toBe(429);
    expect(res.statusText).toBe("Too Many Requests");
    expect(await res.text()).toBe(deny.bodyText);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("X-Rate-Limit-Scope")).toBe("platform-owner");
    expectDeprecation(res, "/billing/pilot-status");
    expect(mockGetBillingPilotDiagnostics).not.toHaveBeenCalled();
  });

  it("POST alias /admin/billing/reprocess-event preserves handler 429 without mutation", async () => {
    const deny = ownerDeny429("phase2b3-write-429-nonce");
    mockRequirePlatformOwnerApi.mockResolvedValueOnce(deny);
    const { POST } = await import("./billing/reprocess-event/route");
    const res = await POST(
      new Request("https://x/api/v1/admin/billing/reprocess-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: "e1" }),
      })
    );
    expect(res.status).toBe(429);
    expect(res.statusText).toBe("Too Many Requests");
    expect(await res.text()).toBe(deny.bodyText);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(res.headers.get("X-Rate-Limit-Scope")).toBe("platform-owner");
    expectDeprecation(res, "/billing/reprocess-event");
    expect(mockReprocessBillingEventOps).not.toHaveBeenCalled();
  });
});
