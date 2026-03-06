import { describe, expect, it, vi, beforeEach } from "vitest";
import { listForManager } from "./upload-session.repository";

const mockRows = [
  {
    id: "s1",
    tenant_id: "t1",
    user_id: "u1",
    purpose: "report_before",
    status: "created",
    created_at: "2025-01-01T00:00:00Z",
    expires_at: "2025-01-02T00:00:00Z",
  },
];

describe("upload-session.repository listForManager", () => {
  const mockRange = vi.fn().mockResolvedValue({ data: mockRows, error: null, count: 1 });
  const mockSelect = vi.fn();
  let chain: ReturnType<typeof createChain>;
  function createChain() {
    const c = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      range: mockRange,
    };
    (c as any).eq.mockReturnValue(c);
    (c as any).order.mockReturnValue(c);
    (c as any).gte.mockReturnValue(c);
    (c as any).lte.mockReturnValue(c);
    (c as any).in.mockReturnValue(c);
    (c as any).lt.mockReturnValue(c);
    return c;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockRange.mockResolvedValue({ data: mockRows, error: null, count: 1 });
    chain = createChain();
    mockSelect.mockReturnValue(chain);
  });

  it("returns rows and total from supabase", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as any;
    const result = await listForManager(supabase, "t1", { limit: 10, offset: 0 });
    expect(result.rows).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(chain.in).not.toHaveBeenCalled();
    expect(chain.lt).not.toHaveBeenCalled();
  });

  it("when stuck=true applies in(created,uploaded) and lt(created_at, threshold)", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as any;
    await listForManager(supabase, "t1", { stuck: true });
    expect(chain.in).toHaveBeenCalledWith("status", ["created", "uploaded"]);
    expect(chain.lt).toHaveBeenCalledTimes(1);
    const ltArg = (chain.lt as any).mock.calls[0][1];
    expect(ltArg).toBeDefined();
    const threshold = new Date(ltArg);
    const expectedMin = Date.now() - 5 * 60 * 60 * 1000;
    const expectedMax = Date.now() - 3 * 60 * 60 * 1000;
    expect(threshold.getTime()).toBeGreaterThanOrEqual(expectedMin);
    expect(threshold.getTime()).toBeLessThanOrEqual(expectedMax);
  });

  it("when stuck=true and stuckHours=2 uses 2h threshold", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as any;
    await listForManager(supabase, "t1", { stuck: true, stuckHours: 2 });
    expect(chain.lt).toHaveBeenCalledTimes(1);
    const ltArg = (chain.lt as any).mock.calls[0][1];
    const threshold = new Date(ltArg);
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    expect(Math.abs(threshold.getTime() - twoHoursAgo)).toBeLessThan(60_000);
  });

  it("when stuck=false does not apply in or lt", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as any;
    await listForManager(supabase, "t1", { stuck: false });
    expect(chain.in).not.toHaveBeenCalled();
    expect(chain.lt).not.toHaveBeenCalled();
  });

  it("clamps stuckHours to 1-168", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as any;
    await listForManager(supabase, "t1", { stuck: true, stuckHours: 0 });
    const ltArg = (chain.lt as any).mock.calls[0][1];
    const threshold = new Date(ltArg);
    const oneHourAgo = Date.now() - 1 * 60 * 60 * 1000;
    expect(Math.abs(threshold.getTime() - oneHourAgo)).toBeLessThan(60_000);
  });
});
