import { describe, expect, it } from "vitest";
import {
  evaluateProvisionPlan,
  PRODUCTION_HOSTS,
  STAGING_MUTATION_ORIGIN,
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
    expect(STAGING_MUTATION_ORIGIN).toBe("https://staging.aistroyka.ai");
    expect(plan.status).toBe("BLOCKED");
  });

  it.each([
    ["https://staging.aistroyka.ai", "READY"],
    ["https://aistroyka.ai", "BLOCKED"],
    ["https://www.aistroyka.ai", "BLOCKED"],
    ["https://aistroyka-web-web-v7jq.vercel.app", "BLOCKED"],
    ["https://staging.aistroyka.com", "BLOCKED"],
    ["https://staging.aistroyka.ai.", "BLOCKED"],
    ["https://evil.example", "BLOCKED"],
  ] as const)("mutation allowlist %s → %s", (url, status) => {
    const plan = evaluateProvisionPlan({
      argv: [],
      env: { ...stagingEnv, PILOT_E2E_BASE_URL: url },
    });
    expect(plan.status).toBe(status);
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
        expect(init?.method || "GET").toBe("GET");
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
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
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
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

  it("fails revoke when the intake probe is a validation or server error, not an auth denial", async () => {
    const fetchImpl = async (url: string, init?: RequestInit) => {
      if (String(url).includes("/auth/v1/token")) {
        return new Response(JSON.stringify({ access_token: "tok" }), { status: 200 });
      }
      if (init?.method === "PATCH") {
        return new Response(JSON.stringify({ data: { status: "revoked" } }), { status: 200 });
      }
      if (String(url).includes("/api/v1/portal/intake")) {
        return new Response(JSON.stringify({ error: "x-tenant-id or project_id is required" }), { status: 400 });
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
    expect(result.reason).toMatch(/unexpected status/);
  });

  it("fails revoke as BLOCKED_EXTERNAL when stakeholder password grant fails", async () => {
    const fetchImpl = async (url: string, init?: RequestInit) => {
      if (String(url).includes("/auth/v1/token")) {
        if (String(init?.body || "").includes("owner@example.com")) {
          return new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 });
        }
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
      return new Response("nope", { status: 500 });
    };
    const result = await provisionStagingStakeholder({
      env: stagingEnv,
      argv: ["node", "script", "--revoke"],
      fetchImpl,
    });
    expect(result.status).toBe("BLOCKED_EXTERNAL");
  });
});
