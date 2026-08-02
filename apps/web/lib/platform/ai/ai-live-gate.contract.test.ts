import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const gatePath = resolve(__dirname, "../../../../../scripts/smoke/ai_live_provider.sh");

describe("ai_live_provider.sh contract", () => {
  const src = readFileSync(gatePath, "utf8");

  it("does not use --location-trusted or Authorization-preserving redirects", () => {
    expect(src).not.toMatch(/--location-trusted/);
    expect(src).toMatch(/--max-redirs 0/);
  });

  it("does not default to a random external Unsplash image", () => {
    expect(src).not.toMatch(/images\.unsplash\.com/);
    expect(src).toMatch(/IMAGE_URL_required_controlled_input/);
  });

  it("requires explicit BASE_URL (no silent production default)", () => {
    expect(src).toMatch(/BASE_URL_required/);
    expect(src).not.toMatch(/BASE_URL:-\$\{?https:\/\/aistroyka\.ai/);
    expect(src).not.toMatch(/BASE="\$\{BASE_URL:-https:\/\/aistroyka\.ai\}"/);
  });

  it("classifies direct OpenAI probe separately and never satisfies --require-live", () => {
    expect(src).toMatch(/credentials_provider_probe/);
    expect(src).toMatch(/product_live_succeeded/);
    expect(src).toMatch(/require-live needs product_route_live/);
    // Direct success must not set product_live_succeeded
    expect(src).toMatch(/credentials_probe_succeeded=true/);
    expect(src).not.toMatch(/credentials_probe_succeeded=true\n\s*product_live_succeeded=true/);
  });

  it("maps missing prerequisites to exit 2 and live product failure to exit 1", () => {
    expect(src).toMatch(/exit 2/);
    expect(src).toMatch(/exit 1/);
    expect(src).toMatch(/prereq_fail/);
  });
});
