import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { AgentError } from "@/lib/agentic/errors";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "manager-1",
  role: "admin",
  subscriptionTier: "pro",
  clientProfile: "web",
  traceId: "trace-1",
};

const { TenantRequiredError } = vi.hoisted(() => {
  class TenantRequiredError extends Error {
    constructor(message = "tenant required") {
      super(message);
      this.name = "TenantRequiredError";
    }
  }
  return { TenantRequiredError };
});

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const getProjectForInternalWorkspace = vi.fn().mockResolvedValue({
  data: { id: "project-1", name: "Project", tenant_id: "tenant-1" },
  error: null,
});
const isAgenticFoundationEnabled = vi.fn().mockResolvedValue(true);
const runProjectAgent = vi.fn().mockResolvedValue({
  runId: "run-1",
  answer: "Overdue tasks threaten handover.",
  health: { score: 55, band: "RED" },
  risks: [],
  blockers: [],
  evidence: [],
  proposedActions: [],
  limitations: [],
  confidence: "medium",
  synthesisSource: "deterministic",
});
const buildAgentExecutionContext = vi.fn().mockResolvedValue({
  tenantId: "tenant-1",
  projectId: "project-1",
  userId: "manager-1",
  actorType: "user",
  roles: ["admin", "manager"],
  permissions: [],
  requestId: "req-1",
  traceId: "trace-1",
  locale: "en",
  source: "WEB",
  timestamp: new Date().toISOString(),
});

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/projects/project.service", () => ({
  getProjectForInternalWorkspace: (...args: unknown[]) => getProjectForInternalWorkspace(...args),
}));

vi.mock("@/lib/domain/project-members/project-members.repository", () => ({
  getMembership: vi.fn().mockResolvedValue({ role: "manager" }),
}));

vi.mock("@/lib/agentic/feature-flag", () => ({
  isAgenticFoundationEnabled: (...args: unknown[]) => isAgenticFoundationEnabled(...args),
}));

vi.mock("@/lib/agentic/orchestrator/orchestrator", () => ({
  runProjectAgent: (...args: unknown[]) => runProjectAgent(...args),
}));

vi.mock("@/lib/agentic/context", () => ({
  buildAgentExecutionContext: (...args: unknown[]) => buildAgentExecutionContext(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/copilot/copilot-ai-gate", () => ({
  gateTenantAiRequest: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/platform/idempotency/idempotency.service", () => ({
  IDEMPOTENCY_HEADER: "x-idempotency-key",
  getCachedResponse: vi.fn().mockResolvedValue(null),
  storeResponse: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/api/lite-allow-list", () => ({
  checkLiteAllowList: vi.fn().mockReturnValue(null),
}));

describe("POST /api/v1/projects/:id/agent", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    isAgenticFoundationEnabled.mockResolvedValue(true);
    getProjectForInternalWorkspace.mockResolvedValue({
      data: { id: "project-1", name: "Project", tenant_id: "tenant-1" },
      error: null,
    });
    runProjectAgent.mockResolvedValue({
      runId: "run-1",
      answer: "Overdue tasks threaten handover.",
      health: { score: 55, band: "RED" },
      risks: [],
      blockers: [],
      evidence: [],
      proposedActions: [],
      limitations: [],
    });
  });

  it("happy path returns structured agent payload", async () => {
    const res = await POST(
      new Request("https://test/api/v1/projects/project-1/agent", {
        method: "POST",
        body: JSON.stringify({ message: "Что сейчас угрожает сдаче этого проекта?" }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.runId).toBe("run-1");
    expect(body.answer).toBeDefined();
    expect(body.health.band).toBe("RED");
  });

  it("returns AGENT_FEATURE_DISABLED when flag is off", async () => {
    isAgenticFoundationEnabled.mockResolvedValueOnce(false);
    const res = await POST(
      new Request("https://test/api/v1/projects/project-1/agent", {
        method: "POST",
        body: JSON.stringify({ message: "hello" }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("AGENT_FEATURE_DISABLED");
  });

  it("returns 403 when project is forbidden", async () => {
    getProjectForInternalWorkspace.mockResolvedValueOnce({ data: null, error: "Insufficient rights" });
    const res = await POST(
      new Request("https://test/api/v1/projects/project-1/agent", {
        method: "POST",
        body: JSON.stringify({ message: "hello" }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("AGENT_PROJECT_ACCESS_DENIED");
  });

  it("maps insufficient evidence from orchestrator", async () => {
    runProjectAgent.mockRejectedValueOnce(
      new AgentError("AGENT_INSUFFICIENT_EVIDENCE", "INSUFFICIENT_EVIDENCE", 422)
    );
    const res = await POST(
      new Request("https://test/api/v1/projects/project-1/agent", {
        method: "POST",
        body: JSON.stringify({ message: "hello" }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("AGENT_INSUFFICIENT_EVIDENCE");
  });

  it("returns unauthorized when tenant is missing", async () => {
    requireTenant.mockImplementationOnce(() => {
      throw new TenantRequiredError("tenant required");
    });
    const res = await POST(
      new Request("https://test/api/v1/projects/project-1/agent", {
        method: "POST",
        body: JSON.stringify({ message: "hello" }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("AGENT_UNAUTHORIZED");
  });

  it("returns AGENT_INVALID_INPUT for empty message", async () => {
    const res = await POST(
      new Request("https://test/api/v1/projects/project-1/agent", {
        method: "POST",
        body: JSON.stringify({ message: "  " }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("AGENT_INVALID_INPUT");
  });

  it("maps provider unavailable from orchestrator", async () => {
    runProjectAgent.mockRejectedValueOnce(
      new AgentError("AGENT_PROVIDER_UNAVAILABLE", "provider down", 503)
    );
    const res = await POST(
      new Request("https://test/api/v1/projects/project-1/agent", {
        method: "POST",
        body: JSON.stringify({ message: "hello" }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("AGENT_PROVIDER_UNAVAILABLE");
  });
});
