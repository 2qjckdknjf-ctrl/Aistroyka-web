import { describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { delegateLegacyTenantAdminPlatformApi } from "./legacy-tenant-admin-api";
import { PLATFORM_API_PREFIX } from "./constants";

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ADMIN_BILLING_ROOT = path.join(WEB_ROOT, "app/api/v1/admin/billing");
const ADMIN_LEADS_ROOT = path.join(WEB_ROOT, "app/api/v1/admin/leads");

/** Exact Phase 2B.3 alias surface: 11 route modules / 13 methods. */
const ALIAS_ROUTE_INVENTORY = [
  {
    file: "app/api/v1/admin/billing/pilot-status/route.ts",
    methods: ["GET"] as const,
    platformImportNeedle: "platform/billing/pilot-status/route",
  },
  {
    file: "app/api/v1/admin/billing/pilot-workspaces/route.ts",
    methods: ["GET", "POST"] as const,
    platformImportNeedle: "platform/billing/pilot-workspaces/route",
  },
  {
    file: "app/api/v1/admin/billing/pilot-workspaces/[workspaceId]/route.ts",
    methods: ["DELETE"] as const,
    platformImportNeedle: "platform/billing/pilot-workspaces/[workspaceId]/route",
  },
  {
    file: "app/api/v1/admin/billing/process-pending-events/route.ts",
    methods: ["POST"] as const,
    platformImportNeedle: "platform/billing/process-pending-events/route",
  },
  {
    file: "app/api/v1/admin/billing/provider-status/route.ts",
    methods: ["GET"] as const,
    platformImportNeedle: "platform/billing/provider-status/route",
  },
  {
    file: "app/api/v1/admin/billing/reprocess-event/route.ts",
    methods: ["POST"] as const,
    platformImportNeedle: "platform/billing/reprocess-event/route",
  },
  {
    file: "app/api/v1/admin/billing/reprocess-workspace-events/route.ts",
    methods: ["POST"] as const,
    platformImportNeedle: "platform/billing/reprocess-workspace-events/route",
  },
  {
    file: "app/api/v1/admin/billing/workspace-status/route.ts",
    methods: ["GET"] as const,
    platformImportNeedle: "platform/billing/workspace-status/route",
  },
  {
    file: "app/api/v1/admin/leads/route.ts",
    methods: ["GET"] as const,
    platformImportNeedle: "platform/leads/route",
  },
  {
    file: "app/api/v1/admin/leads/[id]/route.ts",
    methods: ["GET", "PATCH"] as const,
    platformImportNeedle: "platform/leads/[id]/route",
  },
  {
    file: "app/api/v1/admin/leads/bulk/route.ts",
    methods: ["PATCH"] as const,
    platformImportNeedle: "platform/leads/bulk/route",
  },
] as const;

function listRouteTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listRouteTsFiles(full));
    else if (entry.isFile() && entry.name === "route.ts") out.push(full);
  }
  return out.sort();
}

describe("delegateLegacyTenantAdminPlatformApi", () => {
  it("preserves handler 429 status, statusText, body, Retry-After, and custom headers", async () => {
    const payload = { error: "rate_limited", code: "owner_rate_limited", nonce: "delegate-429-unique" };
    const bodyText = JSON.stringify(payload);
    const handler = vi.fn(async () =>
      new NextResponse(bodyText, {
        status: 429,
        statusText: "Too Many Requests",
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "99",
          "X-Handler": "canonical",
        },
      })
    );
    const res = await delegateLegacyTenantAdminPlatformApi(
      new Request("https://x/api/v1/admin/billing/pilot-status"),
      "/billing/pilot-status",
      handler
    );
    expect(handler).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(429);
    expect(res.statusText).toBe("Too Many Requests");
    expect(await res.text()).toBe(bodyText);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Retry-After")).toBe("99");
    expect(res.headers.get("X-Handler")).toBe("canonical");
    expect(res.headers.get("Deprecation")).toBe("true");
    expect(res.headers.get("Link")).toBe(
      `<${PLATFORM_API_PREFIX}/billing/pilot-status>; rel="successor-version"`
    );
  });

  it("preserves 401/403 payloads and Set-Cookie through shared delegate", async () => {
    const payload = { error: "forbidden", code: "owner_gate", nonce: "delegate-403" };
    const bodyText = JSON.stringify(payload);
    const handlerRes = new NextResponse(bodyText, {
      status: 403,
      statusText: "Forbidden",
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "sb-access-token=tok; Path=/; HttpOnly",
        "X-Keep": "yes",
      },
    });
    const res = await delegateLegacyTenantAdminPlatformApi(
      new Request("https://x/api/v1/admin/leads"),
      "/leads",
      async () => handlerRes
    );
    expect(res.status).toBe(403);
    expect(res.statusText).toBe("Forbidden");
    expect(await res.text()).toBe(bodyText);
    expect(res.headers.get("Set-Cookie")).toBe("sb-access-token=tok; Path=/; HttpOnly");
    expect(res.headers.get("X-Keep")).toBe("yes");
    expect(res.headers.get("Deprecation")).toBe("true");
  });

  it("preserves successful 2xx body and only adds Deprecation/Link", async () => {
    const payload = { workspaces: [{ id: "w1" }] };
    const bodyText = JSON.stringify(payload);
    const res = await delegateLegacyTenantAdminPlatformApi(
      new Request("https://x/api/v1/admin/billing/pilot-workspaces"),
      "/billing/pilot-workspaces",
      async () =>
        new NextResponse(bodyText, {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": "application/json", "X-Ok": "1" },
        })
    );
    expect(res.status).toBe(200);
    expect(res.statusText).toBe("OK");
    expect(await res.text()).toBe(bodyText);
    expect(res.headers.get("X-Ok")).toBe("1");
    expect(res.headers.get("Deprecation")).toBe("true");
    expect(res.headers.get("Link")).toContain(`${PLATFORM_API_PREFIX}/billing/pilot-workspaces`);
  });

  it("preserves 204 empty body through shared delegate", async () => {
    const res = await delegateLegacyTenantAdminPlatformApi(
      new Request("https://x/api/v1/admin/leads/bulk"),
      "/leads/bulk",
      async () => new NextResponse(null, { status: 204, statusText: "No Content" })
    );
    expect(res.status).toBe(204);
    expect(res.statusText).toBe("No Content");
    expect(await res.text()).toBe("");
    expect(res.headers.get("Deprecation")).toBe("true");
  });

  it("all 11 alias route modules expose exactly 13 methods through the shared canonical delegate", () => {
    expect(ALIAS_ROUTE_INVENTORY).toHaveLength(11);

    const expectedFiles = new Set(
      ALIAS_ROUTE_INVENTORY.map((entry) => path.join(WEB_ROOT, entry.file))
    );
    const discovered = [
      ...listRouteTsFiles(ADMIN_BILLING_ROOT),
      ...listRouteTsFiles(ADMIN_LEADS_ROOT),
    ];
    const unknown = discovered.filter((file) => !expectedFiles.has(file));
    expect(unknown).toEqual([]);
    expect(discovered).toHaveLength(11);

    let methodCount = 0;
    for (const entry of ALIAS_ROUTE_INVENTORY) {
      const abs = path.join(WEB_ROOT, entry.file);
      expect(fs.existsSync(abs), `missing alias route ${entry.file}`).toBe(true);
      const source = fs.readFileSync(abs, "utf8");

      expect(source).toContain('from "@/lib/platform-admin/legacy-tenant-admin-api"');
      expect(source).toContain("delegateLegacyTenantAdminPlatformApi");
      expect(source).toContain(entry.platformImportNeedle);
      expect(source).toMatch(/from\s+["'][^"']*\/platform\/[^"']+["']/);

      for (const method of entry.methods) {
        methodCount += 1;
        expect(source).toMatch(new RegExp(`export\\s+async\\s+function\\s+${method}\\b`));
        const exportBlock = source.split(new RegExp(`export\\s+async\\s+function\\s+${method}\\b`))[1];
        expect(exportBlock, `${entry.file} ${method} export missing`).toBeTruthy();
        const untilNextExport = exportBlock!.split(/export\s+async\s+function\s+/)[0];
        expect(untilNextExport).toContain("delegateLegacyTenantAdminPlatformApi");
      }

      // Thin aliases only: no direct supabase / repositories / business services.
      expect(source).not.toMatch(/from\s+["']@\/lib\/supabase\//);
      expect(source).not.toMatch(/from\s+["']@\/lib\/domain\//);
      expect(source).not.toMatch(/from\s+["']@\/lib\/tenant["']/);
      expect(source).not.toMatch(/from\s+["']@\/lib\/observability\//);
      expect(source).not.toMatch(/from\s+["']@\/lib\/ops\//);
      expect(source).not.toMatch(/from\s+["']@\/lib\/sre\//);
      expect(source).not.toMatch(/Repository["']/);
      expect(source).not.toMatch(/from\s+["'][^"']+\.service["']/);
      expect(source).not.toMatch(/from\s+["'][^"']+\.repository["']/);
    }

    expect(methodCount).toBe(13);
  });
});
