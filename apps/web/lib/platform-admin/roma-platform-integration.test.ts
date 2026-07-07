import { describe, expect, it } from "vitest";
import { LIVE_SOURCE_CATALOG } from "./roma-live-probes";

describe("ROMA platform integration catalog", () => {
  it("includes Phase 2 platform service sources", () => {
    const ids = LIVE_SOURCE_CATALOG.map((s) => s.id);
    expect(ids).toContain("platform_overview");
    expect(ids).toContain("push_outbox_health");
    expect(ids).toContain("billing_platform_inventory");
    expect(LIVE_SOURCE_CATALOG.length).toBe(18);
  });
});
