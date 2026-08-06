/**
 * Recovery script classification tests (node:test / vitest-compatible via bun test).
 * Run: bun test scripts/ops/requeue-dead-ai-analyze-media.test.mjs
 */
import { describe, expect, it } from "bun:test";
import { classifyJobMediaReference } from "./requeue-dead-ai-analyze-media.mjs";

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
const sessionId = "33333333-3333-4333-8333-333333333333";
const supabaseUrl = "https://abc.supabase.co";

describe("classifyJobMediaReference", () => {
  it("rejects poisoned media.file_url as security_rejected / not recoverable", () => {
    const result = classifyJobMediaReference({
      media: {
        id: "m1",
        tenant_id: tenantA,
        project_id: null,
        file_url: `${supabaseUrl}/storage/v1/object/public/media/${tenantB}/secret.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
    });
    expect(result.resolvable).toBe(false);
    expect(result.security_rejected).toBe(true);
    expect(result.permanently_unrecoverable).toBe(true);
    expect(JSON.stringify(result)).not.toContain(tenantB);
  });

  it("rejects poisoned direct object path", () => {
    const result = classifyJobMediaReference({
      media: {
        tenant_id: tenantA,
        file_url: `${tenantB}/secret.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
    });
    expect(result.resolvable).toBe(false);
    expect(result.security_rejected).toBe(true);
  });

  it("accepts valid tenant media URL", () => {
    const result = classifyJobMediaReference({
      media: {
        tenant_id: tenantA,
        file_url: `${supabaseUrl}/storage/v1/object/public/media/${tenantA}/ok.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
    });
    expect(result.resolvable).toBe(true);
    expect(result.security_rejected).toBe(false);
  });

  it("accepts valid upload session path", () => {
    const result = classifyJobMediaReference({
      media: null,
      session: {
        id: sessionId,
        tenant_id: tenantA,
        status: "finalized",
        object_path: `media/${tenantA}/${sessionId}/a.jpg`,
      },
      tenantId: tenantA,
      supabaseUrl,
    });
    expect(result.resolvable).toBe(true);
    expect(result.bucketRelativePath).toBe(`${tenantA}/${sessionId}/a.jpg`);
  });

  it("rejects session path pointing at other tenant", () => {
    const result = classifyJobMediaReference({
      media: null,
      session: {
        id: sessionId,
        tenant_id: tenantA,
        status: "finalized",
        object_path: `media/${tenantB}/${sessionId}/a.jpg`,
      },
      tenantId: tenantA,
      supabaseUrl,
    });
    expect(result.resolvable).toBe(false);
    expect(result.security_rejected).toBe(true);
  });

  it("dry-run classification never marks poisoned file_url recoverable", () => {
    const poisoned = [
      `${tenantB}/secret.jpg`,
      `${supabaseUrl}/storage/v1/object/public/media/${tenantB}/secret.jpg`,
      `${supabaseUrl}/storage/v1/object/sign/media/${tenantB}/secret.jpg?token=x`,
      `${supabaseUrl}/storage/v1/object/authenticated/media/${tenantB}/secret.jpg`,
    ];
    for (const file_url of poisoned) {
      const result = classifyJobMediaReference({
        media: { tenant_id: tenantA, file_url },
        session: {
          id: sessionId,
          tenant_id: tenantA,
          status: "finalized",
          object_path: `media/${tenantA}/${sessionId}/ok.jpg`,
        },
        tenantId: tenantA,
        supabaseUrl,
      });
      expect(result.resolvable).toBe(false);
      expect(result.security_rejected).toBe(true);
      expect(result.permanently_unrecoverable).toBe(true);
    }
  });

  it("security_rejected jobs are never resolvable (execute cannot requeue them)", () => {
    const result = classifyJobMediaReference({
      media: {
        tenant_id: tenantA,
        file_url: `${tenantB}/poison.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
    });
    // main() only updates when classification.resolvable && !security_rejected
    expect(result.security_rejected).toBe(true);
    expect(result.resolvable).toBe(false);
  });

  it("does not classify another tenant's media as recoverable for this tenant scope", () => {
    const result = classifyJobMediaReference({
      media: {
        tenant_id: tenantB,
        file_url: `${supabaseUrl}/storage/v1/object/public/media/${tenantB}/ok.jpg`,
      },
      session: null,
      tenantId: tenantA,
      supabaseUrl,
    });
    expect(result.resolvable).toBe(false);
    expect(result.security_rejected).toBe(true);
    expect(result.reason).toBe("media_tenant_mismatch");
  });
});
