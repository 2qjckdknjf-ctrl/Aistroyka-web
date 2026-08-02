/**
 * Static contract: Cloudflare Worker deploy configs must trust cf-connecting-ip.
 * Local/Vercel must not inherit this via this file — flag is Worker [env.*.vars] only.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Cloudflare trusted-ingress contact IP config", () => {
  it("wrangler.toml enables AISTROYKA_TRUST_CF_CONNECTING_IP for Worker envs", () => {
    const src = read("wrangler.toml");
    expect(src).toMatch(/\[env\.dev\.vars\][\s\S]*AISTROYKA_TRUST_CF_CONNECTING_IP\s*=\s*"1"/);
    expect(src).toMatch(/\[env\.staging\.vars\][\s\S]*AISTROYKA_TRUST_CF_CONNECTING_IP\s*=\s*"1"/);
    expect(src).toMatch(/\[env\.production\.vars\][\s\S]*AISTROYKA_TRUST_CF_CONNECTING_IP\s*=\s*"1"/);
  });

  it("wrangler.deploy.toml enables AISTROYKA_TRUST_CF_CONNECTING_IP for Worker envs", () => {
    const src = read("wrangler.deploy.toml");
    expect(src).toMatch(/\[env\.dev\.vars\][\s\S]*AISTROYKA_TRUST_CF_CONNECTING_IP\s*=\s*"1"/);
    expect(src).toMatch(/\[env\.staging\.vars\][\s\S]*AISTROYKA_TRUST_CF_CONNECTING_IP\s*=\s*"1"/);
    expect(src).toMatch(/\[env\.production\.vars\][\s\S]*AISTROYKA_TRUST_CF_CONNECTING_IP\s*=\s*"1"/);
  });
});
