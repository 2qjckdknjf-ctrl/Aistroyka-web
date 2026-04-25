import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

describe("/api/v1/worker compatibility endpoint", () => {
  it("GET returns worker discovery guidance instead of the old 501 stub", async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      service: "worker",
      status: "available",
    });
    expect(body.code).not.toBe("worker_stub");
    expect(body.canonical_routes.report_create).toBe("/api/v1/worker/report/create");
    expect(body.canonical_routes.report_add_media).toBe("/api/v1/worker/report/add-media");
    expect(body.canonical_routes.report_submit).toBe("/api/v1/worker/report/submit");
    expect(body.canonical_routes.sync).toBe("/api/v1/worker/sync");
    expect(body.canonical_routes.upload_sessions).toBe("/api/v1/media/upload-sessions");
    expect(body.canonical_routes.config).toBe("/api/v1/config");
  });

  it("POST does not silently succeed and returns canonical route guidance", async () => {
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("GET");
    expect(body).toMatchObject({
      error: "Method not allowed",
      code: "method_not_allowed",
    });
    expect(body.canonical_routes.report_create).toBe("/api/v1/worker/report/create");
    expect(body.canonical_routes.report_submit).toBe("/api/v1/worker/report/submit");
  });

  it("responses do not expose tenant, user, token, or secret material", async () => {
    const getBody = await (await GET()).json();
    const postBody = await (await POST()).json();
    const serialized = JSON.stringify([getBody, postBody]).toLowerCase();

    expect(serialized).not.toContain("tenant_id");
    expect(serialized).not.toContain("user_id");
    expect(serialized).not.toContain("authorization");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("service_role");
  });
});
