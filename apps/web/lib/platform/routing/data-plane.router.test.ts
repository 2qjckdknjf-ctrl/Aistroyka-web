import { describe, expect, it, vi } from "vitest";
import { getDataPlane } from "./data-plane.router";

const mockGetRegion = vi.fn();
const mockGetShard = vi.fn();
vi.mock("./region.service", () => ({ getRegionForTenant: (...args: unknown[]) => mockGetRegion(...args) }));
vi.mock("./shard.service", () => ({ getShardForTenant: (...args: unknown[]) => mockGetShard(...args) }));

describe("data-plane.router", () => {
  it("returns default connectionHint when shard is default", async () => {
    mockGetRegion.mockResolvedValue("us");
    mockGetShard.mockResolvedValue("default");
    const result = await getDataPlane({} as any, "t1");
    expect(result.connectionHint).toBe("default");
    expect(result.region).toBe("us");
    expect(result.shard).toBe("default");
  });
});
