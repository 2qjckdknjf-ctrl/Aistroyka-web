import { describe, it, expect, vi } from "vitest";
import {
  isOwnerSide,
  requireOwnerSide,
  getProjectWithAccess,
  requireProjectAccess,
  requireOwnerProjectAccess,
  getProjectMembership,
  isProjectOwner,
  requireProjectOwner,
  ProjectAccessError,
} from "./project-access";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";

const baseCtx: TenantContext = {
  tenantId: "t1",
  userId: "u1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "web",
  traceId: "trace",
};

function createSupabaseMock(overrides: {
  projectMembers?: { role: string } | null;
  project?: { id: string; name: string; tenant_id: string; created_at: string } | null;
}): SupabaseClient {
  const { projectMembers, project } = overrides;
  return {
    from: vi.fn((table: string) => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
      };
      if (table === "project_members") {
        chain.maybeSingle.mockResolvedValue({ data: projectMembers ?? null, error: null });
      } else if (table === "projects") {
        chain.maybeSingle.mockResolvedValue({ data: project ?? null, error: null });
      }
      return chain;
    }),
  } as unknown as SupabaseClient;
}

describe("project-access", () => {
  describe("isOwnerSide", () => {
    it("returns true for role owner", () => {
      expect(isOwnerSide({ ...baseCtx, role: "owner" })).toBe(true);
    });
    it("returns false for admin, member, viewer", () => {
      expect(isOwnerSide({ ...baseCtx, role: "admin" })).toBe(false);
      expect(isOwnerSide({ ...baseCtx, role: "member" })).toBe(false);
      expect(isOwnerSide({ ...baseCtx, role: "viewer" })).toBe(false);
    });
  });

  describe("requireOwnerSide", () => {
    it("throws for non-owner with forbidden code", () => {
      try {
        requireOwnerSide({ ...baseCtx, role: "member" });
      } catch (e) {
        expect(e).toBeInstanceOf(ProjectAccessError);
        expect((e as ProjectAccessError).code).toBe("forbidden");
      }
    });
    it("throws for missing tenant with tenant_required code", () => {
      try {
        requireOwnerSide({ ...baseCtx, tenantId: "" as unknown as string, userId: "u1", role: "owner" });
      } catch (e) {
        expect(e).toBeInstanceOf(ProjectAccessError);
        expect((e as ProjectAccessError).code).toBe("tenant_required");
      }
    });
    it("does not throw for owner", () => {
      expect(() => requireOwnerSide({ ...baseCtx, role: "owner" })).not.toThrow();
    });
  });

  describe("getProjectWithAccess", () => {
    it("returns project when user has membership", async () => {
      const project = { id: "p1", name: "P1", tenant_id: "t1", created_at: "2024-01-01" };
      const supabase = createSupabaseMock({ projectMembers: { role: "manager" }, project });
      const result = await getProjectWithAccess(supabase, baseCtx, "p1");
      expect(result.project).toEqual(project);
      expect(result.error).toBeNull();
    });
    it("returns error when user has no membership", async () => {
      const supabase = createSupabaseMock({ projectMembers: null, project: { id: "p1", name: "P1", tenant_id: "t1", created_at: "2024-01-01" } });
      const result = await getProjectWithAccess(supabase, baseCtx, "p1");
      expect(result.project).toBeNull();
      expect(result.error).toBe("Project not found");
    });
  });

  describe("requireProjectAccess", () => {
    it("throws not_found when no membership", async () => {
      const supabase = createSupabaseMock({ projectMembers: null });
      await expect(requireProjectAccess(supabase, baseCtx, "p1")).rejects.toThrow(ProjectAccessError);
      try {
        await requireProjectAccess(supabase, baseCtx, "p1");
      } catch (e) {
        expect((e as ProjectAccessError).code).toBe("not_found");
      }
    });
  });

  describe("requireOwnerProjectAccess / requireProjectOwner", () => {
    it("throws forbidden when user is member but not owner", async () => {
      const supabase = createSupabaseMock({
        projectMembers: { role: "manager" },
        project: { id: "p1", name: "P1", tenant_id: "t1", created_at: "2024-01-01" },
      });
      await expect(requireOwnerProjectAccess(supabase, baseCtx, "p1")).rejects.toThrow(ProjectAccessError);
      try {
        await requireOwnerProjectAccess(supabase, baseCtx, "p1");
      } catch (e) {
        expect((e as ProjectAccessError).code).toBe("forbidden");
      }
    });
  });

  describe("isProjectOwner", () => {
    it("returns true when project_members has owner role", async () => {
      const supabase = createSupabaseMock({ projectMembers: { role: "owner" } });
      const result = await isProjectOwner(supabase, "t1", "p1", "u1");
      expect(result).toBe(true);
    });
    it("returns false when project_members has manager role", async () => {
      const supabase = createSupabaseMock({ projectMembers: { role: "manager" } });
      const result = await isProjectOwner(supabase, "t1", "p1", "u1");
      expect(result).toBe(false);
    });
  });

  describe("getProjectMembership", () => {
    it("returns manager when project_members has manager role", async () => {
      const supabase = createSupabaseMock({ projectMembers: { role: "manager" } });
      const result = await getProjectMembership(supabase, "t1", "p1", "u1");
      expect(result).toEqual({ role: "manager", source: "project_members" });
    });
    it("returns owner when project_members has owner role", async () => {
      const supabase = createSupabaseMock({ projectMembers: { role: "owner" } });
      const result = await getProjectMembership(supabase, "t1", "p1", "u1");
      expect(result).toEqual({ role: "owner", source: "project_members" });
    });
    it("returns internal_member when project_members has worker role", async () => {
      const supabase = createSupabaseMock({ projectMembers: { role: "worker" } });
      const result = await getProjectMembership(supabase, "t1", "p1", "u1");
      expect(result).toEqual({ role: "internal_member", source: "project_members" });
    });
    it("returns null when no project_members row", async () => {
      const supabase = createSupabaseMock({ projectMembers: null });
      const result = await getProjectMembership(supabase, "t1", "p1", "u1");
      expect(result).toBeNull();
    });
  });
});
