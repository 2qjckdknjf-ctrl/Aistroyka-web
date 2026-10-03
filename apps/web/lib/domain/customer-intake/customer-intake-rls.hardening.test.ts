import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/20261003170000_customer_intake_drafts.sql"),
  "utf8"
);

type Grant = { tenantId: string; projectId: string; status: "active" | "revoked" };

function isInternal(role: string): boolean {
  return role === "owner" || role === "admin" || role === "member" || role === "viewer";
}

function hasActiveGrantInTenant(grants: Grant[], tenantId: string): boolean {
  return grants.some((g) => g.tenantId === tenantId && g.status === "active");
}

function hasActiveGrantForProject(grants: Grant[], tenantId: string, projectId: string): boolean {
  return grants.some(
    (g) => g.tenantId === tenantId && g.projectId === projectId && g.status === "active"
  );
}

function stakeholderAuthorized(
  grants: Grant[],
  tenantId: string,
  projectId: string | null,
  projectTenantId: string | null
): boolean {
  if (projectId == null) return hasActiveGrantInTenant(grants, tenantId);
  if (projectTenantId !== tenantId) return false;
  return hasActiveGrantForProject(grants, tenantId, projectId);
}

function canSelect(args: {
  role: string;
  createdBySelf: boolean;
  tenantId: string;
  projectId: string | null;
  projectTenantId: string | null;
  grants: Grant[];
}): boolean {
  if (isInternal(args.role)) return true;
  return args.createdBySelf && stakeholderAuthorized(args.grants, args.tenantId, args.projectId, args.projectTenantId);
}

function isInternalWriter(role: string): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

function canWrite(args: {
  role: string;
  createdBySelf: boolean;
  tenantId: string;
  projectId: string | null;
  projectTenantId: string | null;
  grants: Grant[];
}): boolean {
  if (!args.createdBySelf) return false;
  if (args.projectId != null && args.projectTenantId !== args.tenantId) return false;
  if (isInternalWriter(args.role)) return true;
  return stakeholderAuthorized(args.grants, args.tenantId, args.projectId, args.projectTenantId);
}

const tenant = "t1";
const project = "p1";
const active: Grant[] = [{ tenantId: tenant, projectId: project, status: "active" }];
const revoked: Grant[] = [{ tenantId: tenant, projectId: project, status: "revoked" }];

describe("customer intake draft RLS SQL", () => {
  it("does not treat tenant_members as current stakeholder access", () => {
    expect(sql).not.toMatch(/role = 'stakeholder'/);
    expect(sql).toMatch(/has_active_stakeholder_grant_in_tenant/);
    expect(sql).toMatch(/ps\.status = 'active'/);
  });

  it("separates internal reader/writer from portal grants", () => {
    expect(sql).toMatch(/is_internal_intake_reader/);
    expect(sql).toMatch(/tm\.role in \('owner', 'admin', 'member'\)/);
    expect(sql).not.toMatch(/tm\.role in \('owner', 'admin', 'member', 'viewer'\)/);
    expect(sql).toMatch(/customer_intake_stakeholder_authorized/);
    expect(sql).toMatch(/project_id is null[\s\S]*project_belongs_to_tenant\(project_id, tenant_id\)/);
  });

  it("denies delete explicitly", () => {
    expect(sql).toMatch(/customer_intake_drafts_delete[\s\S]*using \(false\)/);
  });

  it("keeps tenant_id and created_by immutable", () => {
    expect(sql).toMatch(/customer_intake_drafts\.tenant_id is immutable/);
    expect(sql).toMatch(/before update on public\.customer_intake_drafts/);
  });
});

describe("customer intake draft RLS matrix", () => {
  it("1. active stakeholder + project-linked draft is allowed", () => {
    const args = {
      role: "stakeholder",
      createdBySelf: true,
      tenantId: tenant,
      projectId: project,
      projectTenantId: tenant,
      grants: active,
    };
    expect(canWrite(args)).toBe(true);
    expect(canSelect(args)).toBe(true);
  });

  it("2. active stakeholder + projectless draft in same tenant is allowed", () => {
    const args = {
      role: "stakeholder",
      createdBySelf: true,
      tenantId: tenant,
      projectId: null,
      projectTenantId: null,
      grants: active,
    };
    expect(canWrite(args)).toBe(true);
    expect(canSelect(args)).toBe(true);
  });

  it("3. revoked stakeholder + project-linked draft is denied", () => {
    const args = {
      role: "stakeholder",
      createdBySelf: true,
      tenantId: tenant,
      projectId: project,
      projectTenantId: tenant,
      grants: revoked,
    };
    expect(canWrite(args)).toBe(false);
    expect(canSelect(args)).toBe(false);
  });

  it("4. revoked stakeholder + projectless draft is denied", () => {
    const args = {
      role: "stakeholder",
      createdBySelf: true,
      tenantId: tenant,
      projectId: null,
      projectTenantId: null,
      grants: revoked,
    };
    expect(canWrite(args)).toBe(false);
    expect(canSelect(args)).toBe(false);
  });

  it("5. revoked stakeholder cannot update a previously created draft", () => {
    expect(
      canWrite({
        role: "stakeholder",
        createdBySelf: true,
        tenantId: tenant,
        projectId: null,
        projectTenantId: null,
        grants: revoked,
      })
    ).toBe(false);
  });

  it("6. revoked stakeholder cannot select after revoke", () => {
    expect(
      canSelect({
        role: "stakeholder",
        createdBySelf: true,
        tenantId: tenant,
        projectId: null,
        projectTenantId: null,
        grants: revoked,
      })
    ).toBe(false);
  });

  it("7. internal owner/admin/member still write and read", () => {
    for (const role of ["owner", "admin", "member"]) {
      expect(
        canWrite({
          role,
          createdBySelf: true,
          tenantId: tenant,
          projectId: null,
          projectTenantId: null,
          grants: [],
        })
      ).toBe(true);
      expect(
        canSelect({
          role,
          createdBySelf: false,
          tenantId: tenant,
          projectId: null,
          projectTenantId: null,
          grants: [],
        })
      ).toBe(true);
    }
  });

  it("8. viewer can read but cannot write intake drafts", () => {
    expect(
      canSelect({
        role: "viewer",
        createdBySelf: false,
        tenantId: tenant,
        projectId: project,
        projectTenantId: tenant,
        grants: [],
      })
    ).toBe(true);
    expect(
      canWrite({
        role: "viewer",
        createdBySelf: true,
        tenantId: tenant,
        projectId: null,
        projectTenantId: null,
        grants: [],
      })
    ).toBe(false);
  });

  it("9. foreign tenant project_id is denied", () => {
    expect(
      canWrite({
        role: "stakeholder",
        createdBySelf: true,
        tenantId: tenant,
        projectId: project,
        projectTenantId: "other-tenant",
        grants: active,
      })
    ).toBe(false);
    expect(
      canWrite({
        role: "member",
        createdBySelf: true,
        tenantId: tenant,
        projectId: project,
        projectTenantId: "other-tenant",
        grants: [],
      })
    ).toBe(false);
  });

  it("10. moving a draft between tenants is denied by the immutable tenant_id trigger", () => {
    expect(sql).toMatch(/new\.tenant_id is distinct from old\.tenant_id/);
    expect(sql).toMatch(/customer_intake_drafts\.tenant_id is immutable/);
  });
});
