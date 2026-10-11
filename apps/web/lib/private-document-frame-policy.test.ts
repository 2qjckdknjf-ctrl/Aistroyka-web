import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { getApiSecurityHeaders, getPageSecurityHeaders, isPrivateDocumentOriginalPath } from "./security-headers";
const require = createRequire(import.meta.url);
const cjs = require("./security-headers.js");
const uuid = "00000000-0000-4000-8000-000000000001";
const path = `/api/v1/projects/${uuid}/documents/${uuid}/original`;
describe("private document framing only", () => {
  it("allows the application to embed its authenticated PDF while preserving TS/CJS parity", () => {
    expect(isPrivateDocumentOriginalPath(path)).toBe(true);
    expect(getApiSecurityHeaders(path).find(h => h.key === "X-Frame-Options")?.value).toBe("SAMEORIGIN");
    expect(cjs.getApiSecurityHeaders(path)).toEqual(getApiSecurityHeaders(path));
  });
  it.each(["/api/v1/me", "/dashboard", path + "/other", path.replace(uuid, "unknown"), path.replace("/documents/", "/media/")])("preserves frame denial outside exact document originals %s", p => {
    expect(isPrivateDocumentOriginalPath(p)).toBe(false); expect(getApiSecurityHeaders(p).find(h => h.key === "X-Frame-Options")?.value).toBe("DENY");
  });
  it("keeps page frames denied", () => { expect(getPageSecurityHeaders(false).find(h => h.key === "X-Frame-Options")?.value).toBe("DENY"); });
});
