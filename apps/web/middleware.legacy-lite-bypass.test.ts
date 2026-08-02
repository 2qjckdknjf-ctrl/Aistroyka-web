import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const {
  mockUpdateSession,
  mockGateOwnerRequest,
  mockIntlMiddleware,
  mockResolveStakeholderPageRedirect,
} = vi.hoisted(() => ({
  mockUpdateSession: vi.fn(),
  mockGateOwnerRequest: vi.fn(),
  mockIntlMiddleware: vi.fn(),
  mockResolveStakeholderPageRedirect: vi.fn(),
}));

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

vi.mock("@/lib/platform-owner/middleware-owner-gate", () => ({
  gateOwnerRequest: (...args: unknown[]) => mockGateOwnerRequest(...args),
}));

vi.mock("@/lib/tenant/stakeholder-middleware-gate", () => ({
  resolveStakeholderPageRedirect: (...args: unknown[]) =>
    mockResolveStakeholderPageRedirect(...args),
}));

vi.mock("next-intl/middleware", () => ({
  default: () => mockIntlMiddleware,
}));

import { middleware } from "./middleware";
import { checkLiteAllowList, isLegacyProjectsOrAiPath } from "@/lib/api/lite-allow-list";

describe("middleware Phase 2D legacy lite family gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: { id: "u1", email: "u@example.com" },
    });
    mockGateOwnerRequest.mockResolvedValue(null);
    mockIntlMiddleware.mockResolvedValue(NextResponse.next());
    mockResolveStakeholderPageRedirect.mockResolvedValue(null);
  });

  it("wires segment-safe path checks and real checkLiteAllowList (not mocked away)", () => {
    const src = readFileSync(join(process.cwd(), "middleware.ts"), "utf8");
    expect(src).toMatch(/isSamePathOrChild/);
    expect(src).toMatch(/checkLiteAllowList/);
    expect(src).not.toMatch(/pathname\.startsWith\("\/api\/v1"\)/);
  });

  it("returns 403 for lite on legacy /api/projects and /api/ai families", async () => {
    for (const path of ["/api/projects", "/api/projects/p1/upload", "/api/ai/transcribe"]) {
      const req = new NextRequest(`https://x${path}`, {
        method: "POST",
        headers: { "x-client": "ios_lite" },
      });
      const res = await middleware(req);
      expect(res.status, path).toBe(403);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("lite_client_path_forbidden");
    }
  });

  it("does not classify sibling prefixes as legacy families", () => {
    for (const path of ["/api/project", "/api/projectsz", "/api/projects-old", "/api/aix", "/api/ai-tools"]) {
      expect(isLegacyProjectsOrAiPath(path), path).toBe(false);
      expect(checkLiteAllowList(path, "GET", "ios_lite")).toBeNull();
    }
  });

  it("does not treat /api/v1x as /api/v1", async () => {
    const req = new NextRequest("https://x/api/v1x/admin/jobs", {
      method: "GET",
      headers: { "x-client": "ios_lite" },
    });
    const res = await middleware(req);
    expect(res.status).not.toBe(403);
  });
});
