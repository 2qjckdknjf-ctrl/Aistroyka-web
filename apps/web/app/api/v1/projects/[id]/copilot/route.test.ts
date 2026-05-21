import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "manager-1",
  role: "admin",
  subscriptionTier: "pro",
  clientProfile: "web",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const getProject = vi.fn().mockResolvedValue({ data: { id: "project-1", name: "Project" }, error: null });
const runCopilot = vi.fn().mockResolvedValue({
  source: "deterministic",
  summary: "Fallback summary",
});
const isOpenAIConfigured = vi.fn().mockReturnValue(false);

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/projects/project.service", () => ({
  getProject: (...args: unknown[]) => getProject(...args),
}));

vi.mock("@/lib/copilot/copilot.service", () => ({
  runCopilot: (...args: unknown[]) => runCopilot(...args),
}));

vi.mock("@/lib/config/server", () => ({
  isOpenAIConfigured: (...args: unknown[]) => isOpenAIConfigured(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/copilot/copilot-ai-gate", () => ({
  gateCopilotLlmRequest: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/platform/ai-usage/ai-usage.service", () => ({
  recordUsage: vi.fn().mockResolvedValue(undefined),
  checkBudgetAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/observability/ai-telemetry", () => ({
  logCopilotNonStreamComplete: vi.fn(),
  getAiReleaseCorrelation: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAiRuntimeAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("GET /api/v1/projects/:id/copilot", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    getProject.mockResolvedValue({ data: { id: "project-1", name: "Project" }, error: null });
    runCopilot.mockResolvedValue({ source: "deterministic", summary: "Fallback summary" });
    isOpenAIConfigured.mockReturnValue(false);
  });

  it("returns 400 on invalid useCase", async () => {
    const res = await GET(
      new Request("https://test/api/v1/projects/project-1/copilot?useCase=badUseCase"),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(400);
    expect(runCopilot).not.toHaveBeenCalled();
  });

  it("returns 403 when project is outside tenant rights", async () => {
    getProject.mockResolvedValueOnce({ data: null, error: "Insufficient rights" });
    const res = await GET(
      new Request("https://test/api/v1/projects/project-1/copilot?useCase=generateManagerBrief"),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("returns deterministic fallback response when provider unavailable", async () => {
    const res = await GET(
      new Request("https://test/api/v1/projects/project-1/copilot?useCase=generateManagerBrief"),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(200);
    expect(runCopilot).toHaveBeenCalled();
    const body = await res.json();
    expect(body.data.source).toBe("deterministic");
    expect(body.data.summary).toBeDefined();
  });
});

