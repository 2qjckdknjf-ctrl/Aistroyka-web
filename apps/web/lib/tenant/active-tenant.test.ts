import { describe, expect, it } from "vitest";
import {
  ACTIVE_TENANT_COOKIE,
  ACTIVE_TENANT_HEADER,
  asActiveTenantRequest,
  assertSameOriginMutation,
  isActiveTenantResolutionBlocked,
  isTenantIdFormat,
  readActiveTenantCandidate,
  readNamedCookieStrict,
  resolveActiveTenantId,
} from "./active-tenant";

const T1 = "11111111-1111-4111-8111-111111111111";
const T2 = "22222222-2222-4222-8222-222222222222";
const T3 = "33333333-3333-4333-8333-333333333333";

type Mode =
  | { kind: "owned"; ownedIds: string[] }
  | { kind: "membership"; membershipIds: string[] }
  | { kind: "none" };

type ErrorPlan = {
  ownedLookup?: boolean;
  membershipLookup?: boolean;
  accessOwned?: boolean;
  accessMember?: boolean;
};

function makeSupabase(
  mode: Mode,
  access: Set<string> = new Set(),
  errors: ErrorPlan = {}
) {
  return {
    from: (table: string) => {
      const state: { filters: Record<string, string> } = { filters: {} };
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = (col: string, val: string) => {
        state.filters[col] = val;
        return chain;
      };
      chain.order = () => chain;
      chain.limit = () => chain;
      chain.maybeSingle = async () => {
        if (table === "tenants") {
          if (state.filters.id && state.filters.user_id) {
            if (errors.accessOwned) {
              return { data: null, error: { message: "owned access boom" } };
            }
            const ok =
              access.has(state.filters.id) ||
              (mode.kind === "owned" && mode.ownedIds.includes(state.filters.id));
            return { data: ok ? { id: state.filters.id } : null, error: null };
          }
          if (state.filters.user_id && !state.filters.id) {
            if (errors.ownedLookup) {
              return { data: null, error: { message: "owned lookup boom" } };
            }
            if (mode.kind === "owned" && mode.ownedIds.length > 0) {
              const sorted = [...mode.ownedIds].sort();
              return { data: { id: sorted[0] }, error: null };
            }
            return { data: null, error: null };
          }
          return { data: null, error: null };
        }
        if (table === "tenant_members") {
          if (state.filters.tenant_id && state.filters.user_id) {
            if (errors.accessMember) {
              return { data: null, error: { message: "member access boom" } };
            }
            const ok = access.has(state.filters.tenant_id);
            return {
              data: ok ? { tenant_id: state.filters.tenant_id } : null,
              error: null,
            };
          }
          if (state.filters.user_id && !state.filters.tenant_id) {
            if (errors.membershipLookup) {
              return { data: null, error: { message: "membership lookup boom" } };
            }
            if (mode.kind === "membership" && mode.membershipIds.length > 0) {
              const sorted = [...mode.membershipIds].sort();
              return { data: { tenant_id: sorted[0] }, error: null };
            }
            return { data: null, error: null };
          }
        }
        return { data: null, error: null };
      };
      return chain;
    },
  } as never;
}

describe("active-tenant selection (2C adversarial)", () => {
  it("validates UUID format", () => {
    expect(isTenantIdFormat(T1)).toBe(true);
    expect(isTenantIdFormat("not-a-uuid")).toBe(false);
    expect(isTenantIdFormat("")).toBe(false);
  });

  it("asActiveTenantRequest accepts Request and Headers", () => {
    const req = new Request("https://x", { headers: { [ACTIVE_TENANT_HEADER]: T1 } });
    expect(asActiveTenantRequest(req)).toBe(req);
    const h = new Headers({ [ACTIVE_TENANT_HEADER]: T1 });
    const wrapped = asActiveTenantRequest(h);
    expect(wrapped).toBeInstanceOf(Request);
    expect(wrapped?.headers.get(ACTIVE_TENANT_HEADER)).toBe(T1);
  });

  it("strict cookie: single encoded value ok; duplicates fail closed", () => {
    expect(readNamedCookieStrict(`${ACTIVE_TENANT_COOKIE}=${encodeURIComponent(T3)}`, ACTIVE_TENANT_COOKIE)).toEqual(
      { status: "ok", value: T3 }
    );
    expect(
      readNamedCookieStrict(
        `a=1; ${ACTIVE_TENANT_COOKIE}=${T1}; ${ACTIVE_TENANT_COOKIE}=${T2}`,
        ACTIVE_TENANT_COOKIE
      )
    ).toEqual({ status: "duplicate" });
  });

  it("header present blocks cookie even when header value empty/invalid", () => {
    const emptyHeader = new Request("https://x/api", {
      headers: {
        [ACTIVE_TENANT_HEADER]: "",
        cookie: `${ACTIVE_TENANT_COOKIE}=${T2}`,
      },
    });
    expect(readActiveTenantCandidate(emptyHeader)).toMatchObject({
      tenantId: null,
      source: "header",
      headerPresent: true,
      cookieDuplicate: false,
    });
  });

  it("uses owned tenant when no explicit candidate", async () => {
    const supabase = makeSupabase({ kind: "owned", ownedIds: [T1] });
    const result = await resolveActiveTenantId(supabase, "user-1", null);
    expect(result).toEqual({
      tenantId: T1,
      source: "owned",
      explicitRejected: false,
      queryError: false,
    });
    expect(isActiveTenantResolutionBlocked(result)).toBe(false);
  });

  it("owned fallback is deterministic when user owns multiple tenants", async () => {
    const supabase = makeSupabase({ kind: "owned", ownedIds: [T3, T1, T2] });
    const result = await resolveActiveTenantId(supabase, "user-1", null);
    expect(result.tenantId).toBe(T1);
    expect(result.source).toBe("owned");
  });

  it("uses deterministic membership order (lowest tenant_id) when not owner", async () => {
    const supabase = makeSupabase({ kind: "membership", membershipIds: [T3, T2, T1] });
    const result = await resolveActiveTenantId(supabase, "user-1", null);
    expect(result.tenantId).toBe(T1);
    expect(result.source).toBe("membership");
  });

  it("accepts authorized explicit header tenant", async () => {
    const supabase = makeSupabase({ kind: "membership", membershipIds: [T1, T2] }, new Set([T2]));
    const req = new Request("https://x/api", { headers: { [ACTIVE_TENANT_HEADER]: T2 } });
    const result = await resolveActiveTenantId(supabase, "user-1", req);
    expect(result).toEqual({
      tenantId: T2,
      source: "header",
      explicitRejected: false,
      queryError: false,
    });
  });

  it("accepts authorized explicit cookie tenant", async () => {
    const supabase = makeSupabase({ kind: "membership", membershipIds: [T1, T2] }, new Set([T2]));
    const req = new Request("https://x/api", {
      headers: { cookie: `${ACTIVE_TENANT_COOKIE}=${T2}` },
    });
    const result = await resolveActiveTenantId(supabase, "user-1", req);
    expect(result).toEqual({
      tenantId: T2,
      source: "cookie",
      explicitRejected: false,
      queryError: false,
    });
  });

  it("valid header wins over conflicting authorized cookie", async () => {
    const supabase = makeSupabase(
      { kind: "membership", membershipIds: [T1, T2] },
      new Set([T1, T2])
    );
    const req = new Request("https://x/api", {
      headers: {
        [ACTIVE_TENANT_HEADER]: T1,
        cookie: `${ACTIVE_TENANT_COOKIE}=${T2}`,
      },
    });
    const result = await resolveActiveTenantId(supabase, "user-1", req);
    expect(result.tenantId).toBe(T1);
    expect(result.source).toBe("header");
  });

  it("unauthorized header does not fall back to valid cookie", async () => {
    const supabase = makeSupabase({ kind: "membership", membershipIds: [T1] }, new Set([T1]));
    const req = new Request("https://x/api", {
      headers: {
        [ACTIVE_TENANT_HEADER]: T2,
        cookie: `${ACTIVE_TENANT_COOKIE}=${T1}`,
      },
    });
    const result = await resolveActiveTenantId(supabase, "user-1", req);
    expect(result).toEqual({
      tenantId: null,
      source: "none",
      explicitRejected: true,
      queryError: false,
    });
    expect(isActiveTenantResolutionBlocked(result)).toBe(true);
  });

  it("fail-closed rejects unauthorized explicit tenant (no silent fallback)", async () => {
    const supabase = makeSupabase({ kind: "membership", membershipIds: [T1] }, new Set([T1]));
    const req = new Request("https://x/api", { headers: { [ACTIVE_TENANT_HEADER]: T2 } });
    const result = await resolveActiveTenantId(supabase, "user-1", req);
    expect(result).toEqual({
      tenantId: null,
      source: "none",
      explicitRejected: true,
      queryError: false,
    });
  });

  it("fail-closed rejects invalid / malformed UUID explicit claims", async () => {
    const supabase = makeSupabase({ kind: "owned", ownedIds: [T1] });
    for (const bad of ["evil", "11111111-1111-1111-1111-111111111111", " "]) {
      const req = new Request("https://x/api", { headers: { [ACTIVE_TENANT_HEADER]: bad } });
      const result = await resolveActiveTenantId(supabase, "user-1", req);
      expect(result).toEqual({
        tenantId: null,
        source: "none",
        explicitRejected: true,
        queryError: false,
      });
    }
  });

  it("fail-closed on duplicate active-tenant cookies (no first/last pick)", async () => {
    const supabase = makeSupabase({ kind: "membership", membershipIds: [T1, T2] }, new Set([T1, T2]));
    const req = new Request("https://x/api", {
      headers: {
        cookie: `${ACTIVE_TENANT_COOKIE}=${T1}; ${ACTIVE_TENANT_COOKIE}=${T2}`,
      },
    });
    const result = await resolveActiveTenantId(supabase, "user-1", req);
    expect(result).toEqual({
      tenantId: null,
      source: "none",
      explicitRejected: true,
      queryError: false,
    });
  });

  it("fail-closed on access-check DB error (no owned fallback)", async () => {
    const supabase = makeSupabase(
      { kind: "owned", ownedIds: [T1] },
      new Set(),
      { accessOwned: true }
    );
    const req = new Request("https://x/api", { headers: { [ACTIVE_TENANT_HEADER]: T2 } });
    const result = await resolveActiveTenantId(supabase, "user-1", req);
    expect(result).toEqual({
      tenantId: null,
      source: "none",
      explicitRejected: true,
      queryError: true,
    });
  });

  it("fail-closed on owned-lookup DB error (no membership switch)", async () => {
    const supabase = makeSupabase(
      { kind: "membership", membershipIds: [T1] },
      new Set([T1]),
      { ownedLookup: true }
    );
    const result = await resolveActiveTenantId(supabase, "user-1", null);
    expect(result).toEqual({
      tenantId: null,
      source: "none",
      explicitRejected: false,
      queryError: true,
    });
  });

  it("same-origin mutation gate: positive Origin match; rejects missing/cross/foreign/invalid", () => {
    expect(
      assertSameOriginMutation(
        new Request("https://aistroyka.ai/api", {
          headers: {
            origin: "https://aistroyka.ai",
            host: "aistroyka.ai",
            "sec-fetch-site": "same-origin",
          },
        })
      ).ok
    ).toBe(true);

    expect(
      assertSameOriginMutation(
        new Request("https://aistroyka.ai/api", {
          headers: { host: "aistroyka.ai", "sec-fetch-site": "same-origin" },
        })
      ).ok
    ).toBe(true);

    expect(
      assertSameOriginMutation(
        new Request("https://aistroyka.ai/api", {
          headers: { host: "aistroyka.ai", "content-type": "application/json" },
        })
      ).ok
    ).toBe(false);

    expect(
      assertSameOriginMutation(
        new Request("https://aistroyka.ai/api", {
          headers: {
            host: "aistroyka.ai",
            "sec-fetch-site": "cross-site",
          },
        })
      ).ok
    ).toBe(false);

    expect(
      assertSameOriginMutation(
        new Request("https://aistroyka.ai/api", {
          headers: {
            origin: "https://evil.example",
            host: "aistroyka.ai",
            "sec-fetch-site": "same-site",
          },
        })
      ).ok
    ).toBe(false);

    expect(
      assertSameOriginMutation(
        new Request("https://aistroyka.ai/api", {
          headers: { origin: "not-a-url", host: "aistroyka.ai" },
        })
      ).ok
    ).toBe(false);

    expect(
      assertSameOriginMutation(
        new Request("https://aistroyka.ai/api", {
          headers: {
            origin: "https://evil.example",
            host: "aistroyka.ai",
          },
        })
      ).ok
    ).toBe(false);
  });
});
