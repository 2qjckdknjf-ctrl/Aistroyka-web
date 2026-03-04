import { describe, expect, it, vi } from "vitest";
import { getCachedResponse, storeResponse } from "./idempotency.service";
import * as repo from "./idempotency.repository";

vi.mock("./idempotency.repository", () => ({
  getCached: vi.fn(),
  store: vi.fn(),
}));

describe("idempotency.service", () => {
  it("getCachedResponse returns null when repo returns null", async () => {
    (repo.getCached as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await getCachedResponse({} as any, "key1", "t1", "u1", "/api/submit");
    expect(result).toBeNull();
  });

  it("getCachedResponse returns response when cached", async () => {
    (repo.getCached as ReturnType<typeof vi.fn>).mockResolvedValue({ response: { ok: true }, status_code: 200 });
    const result = await getCachedResponse({} as any, "key1", "t1", "u1", "/api/submit");
    expect(result).toEqual({ response: { ok: true }, statusCode: 200 });
  });

  it("storeResponse calls repo.store", async () => {
    (repo.store as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await storeResponse({} as any, "k", "t", "u", "/r", { x: 1 }, 201);
    expect(repo.store).toHaveBeenCalledWith({} as any, "k", "t", "u", "/r", { x: 1 }, 201, 24);
  });
});
