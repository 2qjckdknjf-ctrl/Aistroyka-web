import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  blockAuthenticatedNonPlatformCronCaller,
  PLATFORM_ADMIN_REQUIRED_BODY,
  requirePlatformOwnerLegacyAdminRoute,
} from "./require-platform-admin-legacy-route";

const mockCreateClientFromRequest = vi.fn();
const mockGetSessionUser = vi.fn();
const mockGetPlatformOwnerGrant = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => mockCreateClientFromRequest(...args),
  getSessionUser: (...args: unknown[]) => mockGetSessionUser(...args),
}));

vi.mock("@/lib/platform-owner/platform-owner-grant", () => ({
  getPlatformOwnerGrant: (...args: unknown[]) => mockGetPlatformOwnerGrant(...args),
}));

describe("requirePlatformOwnerLegacyAdminRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClientFromRequest.mockResolvedValue({});
  });

  it("returns 403 when user session is missing", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const res = await requirePlatformOwnerLegacyAdminRoute(new Request("https://x/test"));
    expect(res?.status).toBe(403);
    const body = await res?.json();
    expect(body).toEqual(PLATFORM_ADMIN_REQUIRED_BODY);
  });

  it("returns 403 when platform owner grant is absent", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "u1" });
    mockGetPlatformOwnerGrant.mockResolvedValue({ ok: false, reason: "not_granted" });
    const res = await requirePlatformOwnerLegacyAdminRoute(new Request("https://x/test"));
    expect(res?.status).toBe(403);
  });

  it("returns null when platform owner grant is present", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "u1" });
    mockGetPlatformOwnerGrant.mockResolvedValue({ ok: true, role: "OWNER" });
    const res = await requirePlatformOwnerLegacyAdminRoute(new Request("https://x/test"));
    expect(res).toBeNull();
  });
});

describe("blockAuthenticatedNonPlatformCronCaller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClientFromRequest.mockResolvedValue({});
  });

  it("allows unauthenticated cron callers", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    const res = await blockAuthenticatedNonPlatformCronCaller(new Request("https://x/cron", { method: "POST" }));
    expect(res).toBeNull();
  });

  it("blocks authenticated users without platform grant", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "tenant-admin" });
    mockGetPlatformOwnerGrant.mockResolvedValue({ ok: false, reason: "not_granted" });
    const res = await blockAuthenticatedNonPlatformCronCaller(new Request("https://x/cron", { method: "POST" }));
    expect(res?.status).toBe(403);
  });

  it("allows authenticated platform owners", async () => {
    mockGetSessionUser.mockResolvedValue({ id: "owner-1" });
    mockGetPlatformOwnerGrant.mockResolvedValue({ ok: true, role: "OWNER_OPERATOR" });
    const res = await blockAuthenticatedNonPlatformCronCaller(new Request("https://x/cron", { method: "POST" }));
    expect(res).toBeNull();
  });
});
