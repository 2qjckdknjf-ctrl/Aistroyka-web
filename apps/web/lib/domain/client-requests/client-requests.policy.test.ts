import { beforeEach, describe, expect, it, vi } from "vitest";
import { canManageClientRequests } from "./client-requests.policy";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import * as membersRepo from "@/lib/domain/project-members/project-members.repository";

vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: vi.fn(),
}));

vi.mock("@/lib/domain/project-members/project-members.repository", () => ({
  getMembership: vi.fn(),
}));

vi.mock("@/lib/domain/stakeholders/stakeholders.policy", () => ({
  canReadClientPortalView: vi.fn(),
  canRespondToClientRequests: vi.fn(),
}));

function ctx(role: "owner" | "admin" | "member" | "viewer") {
  return {
    tenantId: "t1",
    userId: "u1",
    role,
    subscriptionTier: "free" as const,
    clientProfile: "web" as const,
    traceId: "tr1",
  };
}

describe("canManageClientRequests", () => {
  beforeEach(() => {
    vi.mocked(projectRepo.getById).mockReset();
    vi.mocked(membersRepo.getMembership).mockReset();
  });

  it("denies when project is not in caller tenant (blocks cross-tenant IDs)", async () => {
    vi.mocked(projectRepo.getById).mockResolvedValue(null);
    const ok = await canManageClientRequests({} as never, ctx("owner"), "foreign-project");
    expect(ok).toBe(false);
    expect(projectRepo.getById).toHaveBeenCalledWith(expect.anything(), "foreign-project", "t1");
    expect(membersRepo.getMembership).not.toHaveBeenCalled();
  });

  it("allows tenant owner when project belongs to tenant", async () => {
    vi.mocked(projectRepo.getById).mockResolvedValue({
      id: "p1",
      name: "P",
      tenant_id: "t1",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    const ok = await canManageClientRequests({} as never, ctx("owner"), "p1");
    expect(ok).toBe(true);
  });

  it("denies tenant member without project manager/owner membership", async () => {
    vi.mocked(projectRepo.getById).mockResolvedValue({
      id: "p1",
      name: "P",
      tenant_id: "t1",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    vi.mocked(membersRepo.getMembership).mockResolvedValue({ role: "worker" });
    const ok = await canManageClientRequests({} as never, ctx("member"), "p1");
    expect(ok).toBe(false);
  });

  it("allows project manager membership", async () => {
    vi.mocked(projectRepo.getById).mockResolvedValue({
      id: "p1",
      name: "P",
      tenant_id: "t1",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    vi.mocked(membersRepo.getMembership).mockResolvedValue({ role: "manager" });
    const ok = await canManageClientRequests({} as never, ctx("member"), "p1");
    expect(ok).toBe(true);
  });

  it("allows project owner membership", async () => {
    vi.mocked(projectRepo.getById).mockResolvedValue({
      id: "p1",
      name: "P",
      tenant_id: "t1",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    vi.mocked(membersRepo.getMembership).mockResolvedValue({ role: "owner" });
    const ok = await canManageClientRequests({} as never, ctx("member"), "p1");
    expect(ok).toBe(true);
  });
});
