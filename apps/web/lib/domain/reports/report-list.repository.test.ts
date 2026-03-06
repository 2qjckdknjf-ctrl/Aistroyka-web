import { describe, expect, it, vi, beforeEach } from "vitest";
import { listReportsForManager } from "./report-list.repository";

const baseRows = [
  { id: "rpt-aaa", user_id: "u1", day_id: "d1", status: "draft", created_at: "2025-01-01T00:00:00Z", submitted_at: null },
  { id: "rpt-bbb", user_id: "u2", day_id: "d2", status: "submitted", created_at: "2025-01-02T00:00:00Z", submitted_at: "2025-01-02T01:00:00Z" },
  { id: "rpt-abc", user_id: "u1", day_id: "d1", status: "submitted", created_at: "2025-01-03T00:00:00Z", submitted_at: "2025-01-03T01:00:00Z" },
];

describe("report-list.repository listReportsForManager", () => {
  const mockEq = vi.fn().mockReturnThis();
  const mockGte = vi.fn().mockReturnThis();
  const mockLte = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();

  let chain: Record<string, unknown> & { then: (resolve: (v: { data: typeof baseRows }) => void) => unknown; catch: () => unknown };

  function buildChain() {
    chain = {
      eq: mockEq,
      order: mockOrder,
      gte: mockGte,
      lte: mockLte,
      limit: mockLimit,
    } as typeof chain;
    chain.then = (resolve: (v: { data: typeof baseRows }) => void) => {
      Promise.resolve({ data: baseRows }).then(resolve);
      return chain as Promise<{ data: typeof baseRows }>;
    };
    chain.catch = () => chain;
    return chain;
  }

  const mockSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    buildChain();
    mockEq.mockReturnValue(chain);
    mockOrder.mockReturnValue(chain);
    mockGte.mockReturnValue(chain);
    mockLte.mockReturnValue(chain);
    mockLimit.mockReturnValue(chain);
    mockSelect.mockReturnValue(chain);
  });

  it("returns rows with project_id when worker_day is present", async () => {
    const dayRows = [
      { id: "d1", project_id: "proj-1" },
      { id: "d2", project_id: "proj-2" },
    ];
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "worker_reports") return { select: mockSelect };
        if (table === "worker_day") return { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: dayRows }) };
        return {};
      }),
    } as any;
    const result = await listReportsForManager(supabase, "t1", { limit: 50 });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((r) => r.project_id != null)).toBe(true);
  });

  it("filters by projectId when provided", async () => {
    const dayRows = [{ id: "d1", project_id: "p1" }, { id: "d2", project_id: "p2" }];
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "worker_reports") return { select: mockSelect };
        if (table === "worker_day") return { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: dayRows }) };
        return {};
      }),
    } as any;
    const result = await listReportsForManager(supabase, "t1", { projectId: "p1", limit: 50 });
    expect(result.every((r) => r.project_id === "p1")).toBe(true);
  });

});
