import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { createClientFromRequest, createClient, getSessionUser } = vi.hoisted(() => ({
  createClientFromRequest: vi.fn(),
  createClient: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest,
  createClient,
  getSessionUser,
  ServiceRoleForbiddenError: class ServiceRoleForbiddenError extends Error {},
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => null),
}));

const { acceptStakeholderInvite } = vi.hoisted(() => ({
  acceptStakeholderInvite: vi.fn(),
}));

vi.mock("@/lib/domain/stakeholders/stakeholders.service", () => ({
  acceptStakeholderInvite,
}));

vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyProjectManagers: vi.fn(),
}));

function requestWithBearer(body: unknown) {
  return new Request("https://test/api/v1/stakeholder-invites/accept", {
    method: "POST",
    headers: { Authorization: "Bearer user.jwt", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/stakeholder-invites/accept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientFromRequest.mockResolvedValue({ client: "request-bound" });
    createClient.mockResolvedValue({ client: "cookie-only" });
  });

  it("uses createClientFromRequest so Bearer CLI sessions authenticate", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", email: "a@b.com" });
    acceptStakeholderInvite.mockResolvedValue({
      data: { project_id: "p1", tenant_id: "t1", stakeholder_role: "client_viewer" },
      error: "",
    });
    const req = requestWithBearer({ token: "invite-token" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalledWith(req);
    expect(createClient).not.toHaveBeenCalled();
    expect(acceptStakeholderInvite).toHaveBeenCalledWith(
      { client: "request-bound" },
      "u1",
      "a@b.com",
      "invite-token"
    );
  });

  it("still works when only a cookie session is present (no Authorization header)", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", email: "a@b.com" });
    acceptStakeholderInvite.mockResolvedValue({
      data: { project_id: "p1", tenant_id: "t1", stakeholder_role: "client_viewer" },
      error: "",
    });
    const req = new Request("https://test/api/v1/stakeholder-invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invite-token" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalledWith(req);
  });

  it("returns 401 when the bound client has no user", async () => {
    getSessionUser.mockResolvedValue(null);
    const res = await POST(requestWithBearer({ token: "invite-token" }));
    expect(res.status).toBe(401);
    expect(acceptStakeholderInvite).not.toHaveBeenCalled();
  });

  it("returns 400 when the invite email does not match the authenticated user", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", email: "other@x.com" });
    acceptStakeholderInvite.mockResolvedValue({
      data: null,
      error: "Sign in with the email address this invitation was sent to.",
    });
    const res = await POST(requestWithBearer({ token: "invite-token" }));
    expect(res.status).toBe(400);
  });

  it("returns 410 for expired invites", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", email: "a@b.com" });
    acceptStakeholderInvite.mockResolvedValue({ data: null, error: "Invitation expired" });
    const res = await POST(requestWithBearer({ token: "invite-token" }));
    expect(res.status).toBe(410);
  });

  it("returns 404 for revoked invites", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", email: "a@b.com" });
    acceptStakeholderInvite.mockResolvedValue({ data: null, error: "Invitation is no longer valid" });
    const res = await POST(requestWithBearer({ token: "invite-token" }));
    expect(res.status).toBe(404);
  });
});
