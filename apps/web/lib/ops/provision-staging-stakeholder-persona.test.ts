import { describe, expect, it } from "vitest";
import {
  evaluateProvisionPlan,
  PRODUCTION_HOSTS,
  provisionStagingStakeholder,
} from "../../../../scripts/pilot/provision_staging_stakeholder_persona.mjs";

const stagingEnv = {
  PILOT_E2E_BASE_URL: "https://staging.aistroyka.ai",
  E2E_EMAIL: "manager@example.com",
  E2E_PASSWORD: "manager-pass",
  STAKEHOLDER_SMOKE_EMAIL: "owner@example.com",
  STAKEHOLDER_SMOKE_PASSWORD: "owner-pass",
  E2E_PROJECT_ID: "project-1",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  STAGING_STAKEHOLDER_PROVISION: "YES",
};

describe("provision staging stakeholder persona", () => {
  it("refuses production hosts", () => {
    const plan = evaluateProvisionPlan({
      argv: [],
      env: { ...stagingEnv, PILOT_E2E_BASE_URL: "https://aistroyka.ai" },
    });
    expect(PRODUCTION_HOSTS).toContain("aistroyka.ai");
    expect(plan.status).toBe("BLOCKED");
    expect(plan.reason).toMatch(/production/);
  });

  it("stays dry-run without the mutation gate", () => {
    const plan = evaluateProvisionPlan({
      argv: [],
      env: { ...stagingEnv, STAGING_STAKEHOLDER_PROVISION: "NO" },
    });
    expect(plan.status).toBe("DRY_RUN");
  });

  it("invites and accepts when the mutation gate is set", async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method || "GET"} ${url}`);
      if (String(url).includes("/auth/v1/token")) {
        return new Response(JSON.stringify({ access_token: "tok" }), { status: 200 });
      }
      if (String(url).includes("/stakeholders") && init?.method === "GET") {
        const firstList = calls.filter((c) => c.startsWith("GET ") && c.includes("/stakeholders")).length === 1;
        return new Response(
          JSON.stringify({
            data: firstList ? [] : [{ email: "owner@example.com", status: "active", id: "sh1" }],
          }),
          { status: 200 }
        );
      }
      if (init?.method === "POST" && String(url).includes("/stakeholders")) {
        return new Response(JSON.stringify({ data: { id: "sh1", token: "invite-token" } }), { status: 200 });
      }
      if (String(url).includes("/stakeholder-invites/accept")) {
        return new Response(JSON.stringify({ data: { project_id: "project-1" } }), { status: 200 });
      }
      if (String(url).includes("/api/v1/me")) {
        return new Response(JSON.stringify({ data: { role: "stakeholder" } }), { status: 200 });
      }
      if (String(url).includes("/api/v1/portal/intake")) {
        const headers = new Headers(init?.headers);
        expect(headers.get("x-tenant-id")).toBe("tenant-1");
        return new Response(JSON.stringify({ data: { id: "draft-1" } }), { status: 201 });
      }
      if (String(url).includes("/api/v1/projects/project-1") && (init?.method || "GET") === "GET") {
        return new Response(JSON.stringify({ data: { id: "project-1", tenant_id: "tenant-1" } }), { status: 200 });
      }
      return new Response("nope", { status: 500 });
    };
    const result = await provisionStagingStakeholder({
      env: stagingEnv,
      argv: ["node", "script", "ignored"],
      fetchImpl,
    });
    expect(result.status).toBe("SUCCESS");
    expect(result.reason).toMatch(/accepted/);
    expect(calls.some((c) => c.includes("/auth/v1/token"))).toBe(true);
    expect(calls.some((c) => c.includes("/stakeholder-invites/accept"))).toBe(true);
  });

  it("revalidates /me and projectless intake when the membership is already active", async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method || "GET"} ${url}`);
      if (String(url).includes("/auth/v1/token")) {
        return new Response(JSON.stringify({ access_token: "tok" }), { status: 200 });
      }
      if (String(url).includes("/stakeholders") && (init?.method || "GET") === "GET") {
        return new Response(
          JSON.stringify({ data: [{ email: "owner@example.com", status: "active", id: "sh1" }] }),
          { status: 200 }
        );
      }
      if (String(url).includes("/api/v1/me")) {
        return new Response(JSON.stringify({ data: { role: "stakeholder" } }), { status: 200 });
      }
      if (String(url).includes("/api/v1/portal/intake")) {
        return new Response(JSON.stringify({ data: { id: "draft-1" } }), { status: 201 });
      }
      if (String(url).includes("/api/v1/projects/project-1")) {
        return new Response(JSON.stringify({ data: { id: "project-1", tenant_id: "tenant-1" } }), { status: 200 });
      }
      return new Response("nope", { status: 500 });
    };
    const result = await provisionStagingStakeholder({
      env: stagingEnv,
      argv: ["node", "script", "ignored"],
      fetchImpl,
    });
    expect(result.status).toBe("SUCCESS");
    expect(result.reason).toMatch(/already active/);
    expect(calls.some((c) => c.includes("/api/v1/me"))).toBe(true);
    expect(calls.some((c) => c.includes("/api/v1/portal/intake"))).toBe(true);
    expect(calls.some((c) => c.includes("/stakeholder-invites/accept"))).toBe(false);
  });

  it("revokes an existing membership when --revoke is set", async () => {
    const fetchImpl = async (url: string, init?: RequestInit) => {
      if (String(url).includes("/auth/v1/token")) {
        return new Response(JSON.stringify({ access_token: "tok" }), { status: 200 });
      }
      if (init?.method === "PATCH") {
        return new Response(JSON.stringify({ data: { status: "revoked" } }), { status: 200 });
      }
      if (String(url).includes("/api/v1/portal/intake")) {
        const headers = new Headers(init?.headers);
        expect(headers.get("x-tenant-id")).toBe("tenant-1");
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
      }
      if (String(url).includes("/stakeholders")) {
        return new Response(
          JSON.stringify({ data: [{ email: "owner@example.com", status: "active", id: "sh1" }] }),
          { status: 200 }
        );
      }
      if (String(url).includes("/api/v1/projects/project-1")) {
        return new Response(JSON.stringify({ data: { id: "project-1", tenant_id: "tenant-1" } }), { status: 200 });
      }
      return new Response("nope", { status: 500 });
    };
    const result = await provisionStagingStakeholder({
      env: stagingEnv,
      argv: ["node", "script", "--revoke"],
      fetchImpl,
    });
    expect(result.status).toBe("SUCCESS");
    expect(result.reason).toMatch(/revoked/);
  });

  it("fails revoke when project tenant lookup fails", async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method || "GET"} ${url}`);
      if (String(url).includes("/auth/v1/token")) {
        return new Response(JSON.stringify({ access_token: "tok" }), { status: 200 });
      }
      if (init?.method === "PATCH") {
        return new Response(JSON.stringify({ data: { status: "revoked" } }), { status: 200 });
      }
      if (String(url).includes("/stakeholders")) {
        return new Response(
          JSON.stringify({ data: [{ email: "owner@example.com", status: "active", id: "sh1" }] }),
          { status: 200 }
        );
      }
      if (String(url).includes("/api/v1/projects/project-1")) {
        return new Response(JSON.stringify({ error: "Unavailable" }), { status: 503 });
      }
      return new Response("nope", { status: 500 });
    };
    const result = await provisionStagingStakeholder({
      env: stagingEnv,
      argv: ["node", "script", "--revoke"],
      fetchImpl,
    });
    expect(result.status).toBe("ERROR");
    expect(result.reason).toMatch(/project tenant_id lookup failed \(503\)/);
    expect(calls.some((c) => c.includes("/api/v1/portal/intake"))).toBe(false);
  });

  for (const status of [400, 500]) {
    it(`fails revoke when the denied intake probe returns ${status}`, async () => {
      const fetchImpl = async (url: string, init?: RequestInit) => {
        if (String(url).includes("/auth/v1/token")) {
          return new Response(JSON.stringify({ access_token: "tok" }), { status: 200 });
        }
        if (init?.method === "PATCH") {
          return new Response(JSON.stringify({ data: { status: "revoked" } }), { status: 200 });
        }
        if (String(url).includes("/api/v1/portal/intake")) {
          const headers = new Headers(init?.headers);
          expect(headers.get("x-tenant-id")).toBe("tenant-1");
          return new Response(JSON.stringify({ error: "Unexpected" }), { status });
        }
        if (String(url).includes("/stakeholders")) {
          return new Response(
            JSON.stringify({ data: [{ email: "owner@example.com", status: "active", id: "sh1" }] }),
            { status: 200 }
          );
        }
        if (String(url).includes("/api/v1/projects/project-1")) {
          return new Response(JSON.stringify({ data: { id: "project-1", tenant_id: "tenant-1" } }), { status: 200 });
        }
        return new Response("nope", { status: 500 });
      };
      const result = await provisionStagingStakeholder({
        env: stagingEnv,
        argv: ["node", "script", "--revoke"],
        fetchImpl,
      });
      expect(result.status).toBe("ERROR");
      expect(result.reason).toMatch(new RegExp(`unexpected status \\(${status}\\)`));
    });
  }

  it("fails revoke when a revoked stakeholder can still write projectless intake", async () => {
    const fetchImpl = async (url: string, init?: RequestInit) => {
      if (String(url).includes("/auth/v1/token")) {
        return new Response(JSON.stringify({ access_token: "tok" }), { status: 200 });
      }
      if (init?.method === "PATCH") {
        return new Response(JSON.stringify({ data: { status: "revoked" } }), { status: 200 });
      }
      if (String(url).includes("/api/v1/portal/intake")) {
        return new Response(JSON.stringify({ data: { id: "leaked" } }), { status: 201 });
      }
      if (String(url).includes("/stakeholders")) {
        return new Response(
          JSON.stringify({ data: [{ email: "owner@example.com", status: "active", id: "sh1" }] }),
          { status: 200 }
        );
      }
      if (String(url).includes("/api/v1/projects/project-1")) {
        return new Response(JSON.stringify({ data: { id: "project-1", tenant_id: "tenant-1" } }), { status: 200 });
      }
      return new Response("nope", { status: 500 });
    };
    const result = await provisionStagingStakeholder({
      env: stagingEnv,
      argv: ["node", "script", "--revoke"],
      fetchImpl,
    });
    expect(result.status).toBe("ERROR");
    expect(result.reason).toMatch(/projectless intake/);
  });
});
