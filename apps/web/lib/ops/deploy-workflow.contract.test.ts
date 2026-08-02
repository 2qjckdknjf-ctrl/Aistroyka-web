import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../../../");

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("Cloudflare deploy workflow provenance contract", () => {
  const staging = read(".github/workflows/deploy-cloudflare-staging.yml");
  const prod = read(".github/workflows/deploy-cloudflare-prod.yml");
  const ci = read(".github/workflows/ci-check.yml");

  it("staging stamps from checked-out HEAD, not raw github.sha", () => {
    expect(staging).toMatch(/git rev-parse HEAD/);
    expect(staging).toMatch(/steps\.build_stamp\.outputs\.sha/);
    expect(staging).not.toMatch(/NEXT_PUBLIC_BUILD_SHA=\$\{\{\s*github\.sha\s*\}\}/);
    expect(staging).toMatch(/Verify runtime buildStamp matches deploy SHA/);
    expect(staging).toMatch(/check-migrations\.sh/);
    expect(staging).toMatch(/Security headers smoke \(staging\)/);
  });

  it("production stamps from checked-out HEAD and verifies apex+www", () => {
    expect(prod).toMatch(/git rev-parse HEAD/);
    expect(prod).toMatch(/steps\.build_stamp\.outputs\.sha/);
    expect(prod).not.toMatch(/NEXT_PUBLIC_BUILD_SHA=\$\{\{\s*github\.sha\s*\}\}/);
    expect(prod).toMatch(/aistroyka\.ai\/api\/v1\/health/);
    expect(prod).toMatch(/www\.aistroyka\.ai\/api\/v1\/health/);
    expect(prod).toMatch(/check-migrations\.sh/);
  });

  it("production remains gated on successful staging workflow_run", () => {
    expect(prod).toMatch(/workflow_run/);
    expect(prod).toMatch(/Deploy Cloudflare \(Staging\)/);
    expect(prod).toMatch(/conclusion\s*==\s*'success'/);
  });

  it("CI Check runs migration filename sanity", () => {
    expect(ci).toMatch(/check-migrations\.sh/);
  });

  it("security_headers.sh rejects duplicates and accepts BASE_URL arg", () => {
    const smoke = read("scripts/smoke/security_headers.sh");
    expect(smoke).toMatch(/duplicate header/);
    expect(smoke).toMatch(/BASE_URL="\$\{1:-/);
    expect(smoke).toMatch(/forbid_header/);
  });
});
