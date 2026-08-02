import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { canManageProjectStakeholders, canReadClientPortalView } from "./stakeholders.policy";
import type { TenantContext } from "@/lib/tenant/tenant.types";

vi.mock("@/lib/domain/project-members/project-members.repository", () => ({
  getMembership: vi.fn(),
}));

vi.mock("@/lib/domain/projects/project-access", () => ({
  isProjectOwner: vi.fn(),
}));

vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: vi.fn(),
}));

vi.mock("./stakeholders.repository", () => ({
  getActiveForUserOnProject: vi.fn(),
}));

const projectMembersRepo = await import("@/lib/domain/project-members/project-members.repository");
const projectAccess = await import("@/lib/domain/projects/project-access");
const projectRepo = await import("@/lib/domain/projects/project.repository");
const stakeholdersRepo = await import("./stakeholders.repository");

const supabase = {} as SupabaseClient;
const ctx = (role: TenantContext["role"]): TenantContext => ({
  tenantId: "tenant-1",
  userId: "user-1",
  role,
  subscriptionTier: "free",
  clientProfile: "web",
  traceId: "trace-1",
});

describe("stakeholders.policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies client-view when project portal flag is missing (getById must load client_portal_enabled)", async () => {
    vi.mocked(projectRepo.getById).mockResolvedValue({
      id: "project-1",
      tenant_id: "tenant-1",
      name: "Build",
      // portal flag omitted — mirrors pre-fix getById select gap
    } as never);
    vi.mocked(projectAccess.isProjectOwner).mockResolvedValue(false);
    vi.mocked(stakeholdersRepo.getActiveForUserOnProject).mockResolvedValue({
      id: "stakeholder-1",
      status: "active",
      stakeholder_role: "client_viewer",
    } as never);

    await expect(canReadClientPortalView(supabase, ctx("stakeholder"), "project-1")).resolves.toBe(false);
    expect(stakeholdersRepo.getActiveForUserOnProject).not.toHaveBeenCalled();
  });

  it("allows stakeholder client-view only when portal is enabled and active project stakeholder exists", async () => {
    vi.mocked(projectRepo.getById).mockResolvedValue({
      id: "project-1",
      tenant_id: "tenant-1",
      name: "Build",
      client_portal_enabled: true,
    } as never);
    vi.mocked(projectAccess.isProjectOwner).mockResolvedValue(false);
    vi.mocked(stakeholdersRepo.getActiveForUserOnProject).mockResolvedValue({
      id: "stakeholder-1",
      tenant_id: "tenant-1",
      project_id: "project-1",
      user_id: "user-1",
      status: "active",
      stakeholder_role: "client_viewer",
    } as never);

    await expect(canReadClientPortalView(supabase, ctx("stakeholder"), "project-1")).resolves.toBe(true);
  });

  it("denies cross-project stakeholder client-view when no active project stakeholder exists", async () => {
    vi.mocked(projectRepo.getById).mockResolvedValue({
      id: "project-2",
      tenant_id: "tenant-1",
      name: "Other",
      client_portal_enabled: true,
    } as never);
    vi.mocked(projectAccess.isProjectOwner).mockResolvedValue(false);
    vi.mocked(stakeholdersRepo.getActiveForUserOnProject).mockResolvedValue(null);

    await expect(canReadClientPortalView(supabase, ctx("stakeholder"), "project-2")).resolves.toBe(false);
  });

  it("does not allow stakeholder to manage project stakeholders", async () => {
    vi.mocked(projectMembersRepo.getMembership).mockResolvedValue({ role: "manager" } as never);

    await expect(canManageProjectStakeholders(supabase, ctx("stakeholder"), "project-1")).resolves.toBe(false);
    expect(projectMembersRepo.getMembership).not.toHaveBeenCalled();
  });
});
