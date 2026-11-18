/**
 * Recovery script classification tests.
 * Run: bun test scripts/ops/requeue-dead-ai-analyze-media.test.mjs
 */
import { describe, expect, it } from "bun:test";
import { classifyJobMediaReference } from "./requeue-dead-ai-analyze-media.mjs";

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
const sessionId = "33333333-3333-4333-8333-333333333333";
const projectA = "55555555-5555-4555-8555-555555555555";
const projectB = "66666666-6666-4666-8666-666666666666";
const supabaseUrl = "https://abc.supabase.co";

function proveOwned(ownedMap) {
  return async (projectId, tenantId) => {
    if (ownedMap.__error) {
      return { ok: false, temporary: true, denied: false, reason: "project_lookup_error" };
    }
    const owner = ownedMap[projectId];
    if (owner && owner === tenantId) {
      return { ok: true, temporary: false, denied: false, reason: "project_owned" };
    }
    return { ok: false, temporary: false, denied: true, reason: "project_not_in_tenant" };
  };
}

describe("classifyJobMediaReference", () => {
  it("rejects poisoned media.file_url as security_rejected / not recoverable", async () => {
    const result = await classifyJobMediaReference({
      media: {
        id: "m1",
        tenant_id: tenantA,
        project_id: null,
        file_url: `${supabaseUrl}/storage/v1/object/public/media/${tenantB}/secret.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
      proveProjectOwnership: proveOwned({}),
    });
    expect(result.resolvable).toBe(false);
    expect(result.security_rejected).toBe(true);
    expect(result.permanently_unrecoverable).toBe(true);
    expect(JSON.stringify(result)).not.toContain(tenantB);
  });

  it("rejects poisoned direct object path", async () => {
    const result = await classifyJobMediaReference({
      media: {
        tenant_id: tenantA,
        file_url: `${tenantB}/secret.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
      proveProjectOwnership: proveOwned({}),
    });
    expect(result.resolvable).toBe(false);
    expect(result.security_rejected).toBe(true);
  });

  it("accepts valid tenant media URL", async () => {
    const result = await classifyJobMediaReference({
      media: {
        tenant_id: tenantA,
        file_url: `${supabaseUrl}/storage/v1/object/public/media/${tenantA}/ok.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
      proveProjectOwnership: proveOwned({}),
    });
    expect(result.resolvable).toBe(true);
    expect(result.security_rejected).toBe(false);
  });

  it("accepts valid upload session path", async () => {
    const result = await classifyJobMediaReference({
      media: null,
      session: {
        id: sessionId,
        tenant_id: tenantA,
        status: "finalized",
        object_path: `media/${tenantA}/${sessionId}/a.jpg`,
      },
      tenantId: tenantA,
      supabaseUrl,
      proveProjectOwnership: proveOwned({}),
    });
    expect(result.resolvable).toBe(true);
    expect(result.bucketRelativePath).toBe(`${tenantA}/${sessionId}/a.jpg`);
  });

  it("rejects session path pointing at other tenant", async () => {
    const result = await classifyJobMediaReference({
      media: null,
      session: {
        id: sessionId,
        tenant_id: tenantA,
        status: "finalized",
        object_path: `media/${tenantB}/${sessionId}/a.jpg`,
      },
      tenantId: tenantA,
      supabaseUrl,
      proveProjectOwnership: proveOwned({}),
    });
    expect(result.resolvable).toBe(false);
    expect(result.security_rejected).toBe(true);
  });

  it("payload.project_id of another tenant is not recoverable", async () => {
    const result = await classifyJobMediaReference({
      media: {
        tenant_id: tenantA,
        file_url: `${projectB}/secret.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
      projectIdClaim: projectB,
      proveProjectOwnership: proveOwned({ [projectB]: tenantB }),
    });
    expect(result.resolvable).toBe(false);
    expect(result.security_rejected).toBe(true);
    expect(JSON.stringify(result)).not.toContain(projectB);
  });

  it("media.project_id of another tenant is not recoverable", async () => {
    const result = await classifyJobMediaReference({
      media: {
        tenant_id: tenantA,
        project_id: projectB,
        file_url: `${tenantA}/ok.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
      proveProjectOwnership: proveOwned({ [projectB]: tenantB }),
    });
    expect(result.resolvable).toBe(false);
    expect(result.security_rejected).toBe(true);
  });

  it("missing project does not make project-prefixed path recoverable", async () => {
    const result = await classifyJobMediaReference({
      media: {
        tenant_id: tenantA,
        file_url: `${projectA}/secret.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
      proveProjectOwnership: proveOwned({}),
    });
    expect(result.resolvable).toBe(false);
    expect(result.security_rejected).toBe(true);
  });

  it("DB lookup error does not make path recoverable", async () => {
    const result = await classifyJobMediaReference({
      media: {
        tenant_id: tenantA,
        file_url: `${projectA}/ok.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
      proveProjectOwnership: proveOwned({ __error: true }),
    });
    expect(result.resolvable).toBe(false);
    expect(result.lookup_error).toBe(true);
    expect(result.security_rejected).toBe(false);
  });

  it("valid project of current tenant can be recoverable", async () => {
    const result = await classifyJobMediaReference({
      media: {
        tenant_id: tenantA,
        project_id: projectA,
        file_url: `${projectA}/ok.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
      proveProjectOwnership: proveOwned({ [projectA]: tenantA }),
    });
    expect(result.resolvable).toBe(true);
    expect(result.security_rejected).toBe(false);
    expect(result.bucketRelativePath).toBe(`${projectA}/ok.jpg`);
  });

  it("security_rejected jobs are never resolvable (execute cannot requeue them)", async () => {
    const result = await classifyJobMediaReference({
      media: {
        tenant_id: tenantA,
        file_url: `${tenantB}/poison.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
      proveProjectOwnership: proveOwned({}),
    });
    expect(result.security_rejected).toBe(true);
    expect(result.resolvable).toBe(false);
  });

  it("does not classify another tenant's media as recoverable for this tenant scope", async () => {
    const result = await classifyJobMediaReference({
      media: {
        tenant_id: tenantB,
        file_url: `${supabaseUrl}/storage/v1/object/public/media/${tenantB}/ok.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
      proveProjectOwnership: proveOwned({}),
    });
    expect(result.resolvable).toBe(false);
    expect(result.security_rejected).toBe(true);
    expect(result.reason).toBe("media_tenant_mismatch");
  });
});
