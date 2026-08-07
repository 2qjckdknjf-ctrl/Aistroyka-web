import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn(),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn(),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));
vi.mock("@/lib/config/server", () => ({
  isAnyVisionProviderConfigured: () => true,
}));

import { GET } from "./route";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant } from "@/lib/tenant";

function makeQuery(rows: unknown[], count = rows.length) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: rows, error: null, count }),
  };
  // summary query ends at .in() without range — return thenable
  chain.then = undefined;
  // For summary: .select().eq().in() — need awaitable terminal
  const terminal = {
    ...chain,
    then: (resolve: (v: unknown) => unknown) =>
      resolve({
        data: rows.map((r: any) => ({ status: r.status })),
        error: null,
        count,
      }),
  };
  // Make in() return chain that is both chainable and awaitable for summary
  chain.in = vi.fn(() => ({
    ...chain,
    order: vi.fn(() => ({
      ...chain,
      range: vi.fn().mockResolvedValue({ data: rows, error: null, count }),
    })),
    // summary path awaits after .in()
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve({
        data: rows.map((r: any) => ({ status: (r as any).status })),
        error: null,
      }).then(resolve),
  }));
  return chain;
}

describe("GET /api/v1/ai/requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTenantContextFromRequest).mockResolvedValue({
      tenantId: "t1",
      userId: "u1",
    } as any);
    vi.mocked(requireTenant).mockReturnValue(undefined as any);
  });

  it("returns dead jobs and summary (not a false empty list)", async () => {
    const rows = [
      {
        id: "j1",
        type: "ai_analyze_media",
        status: "dead",
        payload: { report_id: "r1" },
        attempts: 5,
        max_attempts: 5,
        last_error: "All AI providers failed sk-abcdefghijklmnopqrstuv",
        last_error_type: "AI_PROVIDERS_EXHAUSTED",
        created_at: "2026-08-02T15:00:00Z",
        updated_at: "2026-08-02T15:10:00Z",
      },
    ];
    const supabase = { from: vi.fn(() => makeQuery(rows)) };
    vi.mocked(createClientFromRequest).mockResolvedValue(supabase as any);

    const res = await GET(
      new Request(
        "http://localhost/api/v1/ai/requests?from=2026-08-02&to=2026-08-02",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe("dead");
    expect(body.data[0].user_message_key).toBe("aiStatusTemporary");
    expect(body.data[0].last_error).not.toContain("sk-");
    expect(body.summary.dead).toBe(1);
    expect(body.summary.total).toBe(1);
    expect(body.vision_configured).toBe(true);

    // Ensure date-only `to` was expanded past midnight
    const listChain =
      supabase.from.mock.results[1]?.value ??
      supabase.from.mock.results[0]?.value;
    expect(listChain.lte).toHaveBeenCalled();
  });

  it("does not leak stack traces in API errors", async () => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn(() => ({
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ data: [], error: null }).then(resolve),
        order: vi.fn(() => ({
          range: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "db boom\n    at Object.<anonymous> (x.js:1:1)" },
            count: 0,
          }),
        })),
      })),
    };
    vi.mocked(createClientFromRequest).mockResolvedValue({
      from: vi.fn(() => chain),
    } as any);
    const res = await GET(new Request("http://localhost/api/v1/ai/requests"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to load AI requests");
    expect(JSON.stringify(body)).not.toContain("at Object");
  });
});
