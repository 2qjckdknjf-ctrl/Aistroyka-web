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
  accountActive?: boolean;
}): boolean {
  if (args.accountActive === false) return false;
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
  accountActive?: boolean;
}): boolean {
  if (args.accountActive === false) return false;
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
    expect(sql).toMatch(/customer_intake_location_valid/);
    expect(sql).toMatch(/jsonb_typeof\(p->'precision'\) = 'string'/);
    expect(sql).toMatch(/jsonb_typeof\(p->'label'\) = 'string'/);
    expect(sql).toMatch(/jsonb_typeof\(p->'lat'\) = 'number'/);
    expect(sql).toMatch(/jsonb_typeof\(p->'lng'\) = 'number'/);
    expect(sql).toMatch(/customer_intake_drafts_location_shape/);
    expect(sql).toMatch(/customer_intake_location_valid\(location\) is true/);
    expect(sql).toMatch(/customer_intake_https_url_text_valid/);
    expect(sql).toMatch(/customer_intake_media_id_value_valid/);
    expect(sql).toMatch(/customer_intake_tenant_account_active/);
    expect(sql).toMatch(/a\.status = 'active'/);
    expect(sql).toMatch(/customer_intake_drafts_title_nonblank/);
    expect(sql).toMatch(/customer_intake_drafts_description_nonblank/);
    expect(sql).toMatch(/not \(e \? 'media_id'\) or public\.customer_intake_media_id_value_valid/);
    expect(sql).toMatch(/not \(e \? 'url'\) or public\.customer_intake_media_url_value_valid/);
    expect(sql).toMatch(/jsonb_object_keys\(e\)/);
    expect(sql).toMatch(/where media_key\.key not in \('kind', 'media_id', 'url'\)/);
    expect(sql).toMatch(/%\[0-9A-Fa-f\]\{2\}/);
    expect(sql).toMatch(/regexp_replace\(e #>> '\{\}', '\^\[\[:space:\]\]\+/);
    expect(sql).toMatch(/customer_intake_https_url_text_valid\(p text\)/);
    expect(sql).not.toMatch(/\^https:\/\/\[\^\[:space:\]\/\?#\]\+/);
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

  it("11. suspended account denies select and write", () => {
    expect(
      canSelect({
        role: "owner",
        createdBySelf: true,
        tenantId: tenant,
        projectId: null,
        projectTenantId: null,
        grants: [],
        accountActive: false,
      })
    ).toBe(false);
    expect(
      canWrite({
        role: "member",
        createdBySelf: true,
        tenantId: tenant,
        projectId: null,
        projectTenantId: null,
        grants: [],
        accountActive: false,
      })
    ).toBe(false);
  });
});

function sqlLocationValid(raw: unknown): boolean {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return false;
  const p = raw as Record<string, unknown>;
  const has = (key: string) => Object.prototype.hasOwnProperty.call(p, key);
  if (!has("precision") || typeof p.precision !== "string") return false;
  if (!["address", "city", "region", "coordinates"].includes(p.precision)) return false;
  if (has("label") && typeof p.label !== "string") return false;
  if (has("lat") && typeof p.lat !== "number") return false;
  if (has("lng") && typeof p.lng !== "number") return false;
  return true;
}

const SQL_HTTPS_URL =
  /^https:\/\/(?:(?:%[0-9A-Fa-f]{2}|[A-Za-z0-9._~!$&'()*+,;=:-])+@)?(?:localhost|(?:[0-9]{1,3}\.){3}[0-9]{1,3}|(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)(?:\.(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?))*)(?::[0-9]{1,5})?(?:[/?#](?:%[0-9A-Fa-f]{2}|[A-Za-z0-9._~!$&'()*+,;=:@/?-])*)?$/;

function sqlHttpsUrlValid(raw: string | null): boolean {
  if (raw == null) return false;
  const trimmed = raw.replace(/^\s+|\s+$/g, "");
  if (trimmed.length < 1 || trimmed.length > 2048) return false;
  return SQL_HTTPS_URL.test(trimmed);
}

describe("customer intake location storage contract", () => {
  it("accepts required precision and optional typed coordinates", () => {
    expect(sqlLocationValid({ precision: "city" })).toBe(true);
    expect(sqlLocationValid({ precision: "coordinates", label: "Barcelona", lat: 41.38, lng: 2.17 })).toBe(
      true
    );
  });

  it("rejects missing/invalid precision and wrong optional JSON types", () => {
    expect(sqlLocationValid({ precision: "city", lat: "north" })).toBe(false);
    expect(sqlLocationValid({ precision: "city", lng: {} })).toBe(false);
    expect(sqlLocationValid({ precision: "city", label: 12 })).toBe(false);
    expect(sqlLocationValid({ precision: "city", lat: null })).toBe(false);
    expect(sqlLocationValid({})).toBe(false);
    expect(sqlLocationValid({ precision: "exact" })).toBe(false);
  });
});

describe("customer intake media URL storage contract", () => {
  it("accepts absolute https URLs with a host and optional query", () => {
    expect(sqlHttpsUrlValid("https://example.com/file.jpg")).toBe(true);
    expect(sqlHttpsUrlValid("https://cdn.example.com/path?q=1")).toBe(true);
    expect(sqlHttpsUrlValid("https://user@example.com/file.jpg")).toBe(true);
    expect(sqlHttpsUrlValid("https://%41@example.com/file.jpg")).toBe(true);
  });

  it("rejects empty hosts, http, spaces, malformed percent encoding, and overlong URLs", () => {
    expect(sqlHttpsUrlValid("https://%/")).toBe(false);
    expect(sqlHttpsUrlValid("https://")).toBe(false);
    expect(sqlHttpsUrlValid("http://example.com")).toBe(false);
    expect(sqlHttpsUrlValid("https://exa mple.com")).toBe(false);
    expect(sqlHttpsUrlValid("https://example.com/%zz")).toBe(false);
    expect(sqlHttpsUrlValid("https://%zz@example.com/file.jpg")).toBe(false);
    expect(sqlHttpsUrlValid("https://%@example.com/file.jpg")).toBe(false);
    expect(sqlHttpsUrlValid(`https://example.com/${"a".repeat(2040)}`)).toBe(false);
  });
});
