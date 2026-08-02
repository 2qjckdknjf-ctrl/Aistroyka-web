import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  PLATFORM_OWNER_API_PREFIXES,
  buildIsPlatformOwnerApiPathExpression,
} from "@/lib/platform-admin/platform-api-middleware-exceptions.cjs";
import {
  ORIGINAL_MARKER,
  applyWorkerBypassPatch,
  patchWorkerBypassApiMiddleware,
  verifyPlatformOwnerBypassPostcondition,
} from "./patch-worker-bypass-api-middleware.cjs";

function fixtureUnpatched() {
  return `import { handler as middlewareHandler } from "./middleware/handler.mjs";
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
            // - \`Request\`s are handled by the Next server
            const reqOrResp = await middlewareHandler(request, env, ctx);
    return reqOrResp;
  }
};
`;
}

function fixtureLegacyOwnerPlatformOnly() {
  return `export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
            let reqOrResp;
            if (url.pathname.startsWith("/api/v1/") && !url.pathname.startsWith("/api/v1/owner") && !url.pathname.startsWith("/api/v1/platform")) {
                reqOrResp = request;
            } else {
                const { handler: middlewareHandler } = await import("./middleware/handler.mjs");
                reqOrResp = await middlewareHandler(request, env, ctx);
            }
    return reqOrResp;
  }
};
`;
}

function fixtureIncompatible() {
  return `export default { async fetch() { return new Response("no middleware hook"); } };\n`;
}

describe("patch-worker-bypass-api-middleware fail-closed", () => {
  it("applies segment-safe four-namespace expression to unpatched worker fixture", () => {
    const { code, applied, mode } = applyWorkerBypassPatch(fixtureUnpatched());
    expect(applied).toBe(true);
    expect(mode).toBe("original-marker");
    const post = verifyPlatformOwnerBypassPostcondition(code);
    expect(post).toEqual({ ok: true });
    const expr = buildIsPlatformOwnerApiPathExpression("url.pathname");
    expect(code).toContain(expr);
    for (const prefix of PLATFORM_OWNER_API_PREFIXES) {
      expect(code).toContain(`url.pathname === ${JSON.stringify(prefix)}`);
      expect(code).toContain(`url.pathname.startsWith(${JSON.stringify(`${prefix}/`)})`);
    }
    expect(code).not.toContain(ORIGINAL_MARKER);
  });

  it("upgrades legacy owner+platform-only bypass to include admin billing|leads", () => {
    const { code, applied } = applyWorkerBypassPatch(fixtureLegacyOwnerPlatformOnly());
    expect(applied).toBe(true);
    expect(verifyPlatformOwnerBypassPostcondition(code)).toEqual({ ok: true });
    expect(code).toContain('"/api/v1/admin/billing"');
    expect(code).toContain('"/api/v1/admin/leads"');
  });

  it("fails closed when worker exists but format is incompatible", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistroyka-worker-patch-"));
    const workerPath = path.join(dir, "worker.js");
    fs.writeFileSync(workerPath, fixtureIncompatible(), "utf8");
    expect(() => patchWorkerBypassApiMiddleware(workerPath)).toThrow(/FAIL postcondition/);
    expect(fs.readFileSync(workerPath, "utf8")).toBe(fixtureIncompatible());
  });

  it("is idempotent: second patch does not duplicate bypass block", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aistroyka-worker-patch-"));
    const workerPath = path.join(dir, "worker.js");
    fs.writeFileSync(workerPath, fixtureUnpatched(), "utf8");

    const first = patchWorkerBypassApiMiddleware(workerPath);
    expect(first.skipped).toBe(false);
    const afterFirst = fs.readFileSync(workerPath, "utf8");
    expect(verifyPlatformOwnerBypassPostcondition(afterFirst)).toEqual({ ok: true });

    const second = patchWorkerBypassApiMiddleware(workerPath);
    expect(second.skipped).toBe(false);
    expect(second.mode).toBe("already-satisfying");
    const afterSecond = fs.readFileSync(workerPath, "utf8");
    expect(afterSecond).toBe(afterFirst);
    expect(
      (afterSecond.match(/\/\/ Bypass middleware for \/api\/v1\/\* except platform-owner API namespaces/g) || [])
        .length
    ).toBe(1);
  });

  it("skips with documented reason when worker is missing", () => {
    const missing = path.join(os.tmpdir(), `aistroyka-missing-worker-${Date.now()}.js`);
    const result = patchWorkerBypassApiMiddleware(missing);
    expect(result).toEqual({ skipped: true, reason: "worker_missing" });
  });
});
