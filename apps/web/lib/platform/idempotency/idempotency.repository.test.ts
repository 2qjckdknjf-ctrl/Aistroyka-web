import { describe, expect, it } from "vitest";
import {
  claimPendingStrict,
  finalizeClaim,
  lookupCached,
  PG_UNIQUE_VIOLATION,
  releaseClaim,
} from "./idempotency.repository";

type Row = {
  key: string;
  tenant_id: string;
  user_id: string;
  route: string;
  response: unknown;
  status_code: number;
  expires_at: string;
  claim_token: string | null;
};

/** In-memory thenable Supabase double for idempotency_keys. */
function createMemSupabase(initial: Row[] = []) {
  const rows = new Map<string, Row>();
  for (const r of initial) rows.set(r.key, { ...r });

  let nextInsertError: { code?: string; message?: string } | null = null;
  let nextSelectError: { code?: string; message?: string } | null = null;
  let nextUpdateError: { code?: string; message?: string } | null = null;
  let nextDeleteError: { code?: string; message?: string } | null = null;
  let forceUpdateAffectZero = false;
  let forceDeleteAffectZero = false;

  function from(_table: string) {
    const filters: Record<string, string> = {};
    let ltExpires: string | null = null;
    let mode: "select" | "insert" | "update" | "delete" = "select";
    let insertPayload: Partial<Row> | null = null;
    let updatePayload: Partial<Row> | null = null;

    const api: Record<string, unknown> = {
      select(_cols?: string) {
        return api;
      },
      insert(payload: Partial<Row>) {
        mode = "insert";
        insertPayload = payload;
        return api;
      },
      update(payload: Partial<Row>) {
        mode = "update";
        updatePayload = payload;
        return api;
      },
      delete() {
        mode = "delete";
        return api;
      },
      eq(col: string, val: string) {
        filters[col] = val;
        return api;
      },
      lt(col: string, val: string) {
        if (col === "expires_at") ltExpires = val;
        return api;
      },
      maybeSingle: async () => {
        if (nextSelectError) {
          const err = nextSelectError;
          nextSelectError = null;
          return { data: null, error: err };
        }
        const key = filters.key;
        const row = key ? rows.get(key) : undefined;
        if (!row) return { data: null, error: null };
        if (
          row.tenant_id !== filters.tenant_id ||
          row.user_id !== filters.user_id ||
          row.route !== filters.route
        ) {
          return { data: null, error: null };
        }
        return {
          data: {
            response: row.response,
            status_code: row.status_code,
            expires_at: row.expires_at,
            claim_token: row.claim_token,
          },
          error: null,
        };
      },
      then(resolve: (v: unknown) => void, reject?: (e: unknown) => void) {
        return Promise.resolve()
          .then(async () => {
            if (mode === "insert") {
              if (nextInsertError) {
                const err = nextInsertError;
                nextInsertError = null;
                return { data: null, error: err };
              }
              const key = String(insertPayload?.key ?? "");
              if (rows.has(key)) {
                return { data: null, error: { code: PG_UNIQUE_VIOLATION, message: "duplicate key" } };
              }
              rows.set(key, {
                key,
                tenant_id: String(insertPayload?.tenant_id),
                user_id: String(insertPayload?.user_id),
                route: String(insertPayload?.route),
                response: insertPayload?.response ?? null,
                status_code: Number(insertPayload?.status_code ?? 0),
                expires_at: String(insertPayload?.expires_at),
                claim_token: (insertPayload?.claim_token as string | null) ?? null,
              });
              return { data: null, error: null };
            }

            if (mode === "update") {
              if (nextUpdateError) {
                const err = nextUpdateError;
                nextUpdateError = null;
                return { data: null, error: err };
              }
              if (forceUpdateAffectZero) {
                forceUpdateAffectZero = false;
                return { data: [], error: null };
              }
              const key = filters.key;
              const row = key ? rows.get(key) : undefined;
              if (
                !row ||
                row.tenant_id !== filters.tenant_id ||
                row.user_id !== filters.user_id ||
                row.route !== filters.route ||
                String(row.status_code) !== String(filters.status_code) ||
                (filters.claim_token != null && row.claim_token !== filters.claim_token)
              ) {
                return { data: [], error: null };
              }
              Object.assign(row, updatePayload);
              return { data: [{ key }], error: null };
            }

            if (mode === "delete") {
              if (nextDeleteError) {
                const err = nextDeleteError;
                nextDeleteError = null;
                return { data: null, error: err };
              }
              if (forceDeleteAffectZero) {
                forceDeleteAffectZero = false;
                return { data: [], error: null };
              }
              const key = filters.key;
              const row = key ? rows.get(key) : undefined;
              if (!row) return { data: [], error: null };
              if (
                row.tenant_id !== filters.tenant_id ||
                row.user_id !== filters.user_id ||
                row.route !== filters.route
              ) {
                return { data: [], error: null };
              }
              if (filters.status_code != null && String(row.status_code) !== String(filters.status_code)) {
                return { data: [], error: null };
              }
              if (filters.claim_token != null && row.claim_token !== filters.claim_token) {
                return { data: [], error: null };
              }
              if (ltExpires && !(new Date(row.expires_at).getTime() < new Date(ltExpires).getTime())) {
                return { data: [], error: null };
              }
              rows.delete(key);
              return { data: [{ key }], error: null };
            }

            return { data: null, error: null };
          })
          .then(resolve, reject);
      },
    };

    return api;
  }

  return {
    from,
    rows,
    setInsertError(err: { code?: string; message?: string } | null) {
      nextInsertError = err;
    },
    setSelectError(err: { code?: string; message?: string } | null) {
      nextSelectError = err;
    },
    setUpdateError(err: { code?: string; message?: string } | null) {
      nextUpdateError = err;
    },
    setDeleteError(err: { code?: string; message?: string } | null) {
      nextDeleteError = err;
    },
    setUpdateAffectZero() {
      forceUpdateAffectZero = true;
    },
    setDeleteAffectZero() {
      forceDeleteAffectZero = true;
    },
  };
}

describe("idempotency.repository strict", () => {
  it("lookupCached returns error on select error (not miss)", async () => {
    const db = createMemSupabase();
    db.setSelectError({ message: "boom", code: "57014" });
    const result = await lookupCached(db as never, "k", "t", "u", "/r");
    expect(result).toEqual({ kind: "error" });
  });

  it("unique conflict only via 23505 — other errors are error, not exists", async () => {
    const db = createMemSupabase();
    db.setInsertError({ code: "42501", message: "permission denied unique something" });
    const result = await claimPendingStrict(db as never, "k", "t", "u", "/r", 24);
    expect(result).toEqual({ kind: "error" });
  });

  it("reclaims expired slot with new ownership token", async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const db = createMemSupabase([
      {
        key: "k",
        tenant_id: "t",
        user_id: "u",
        route: "/r",
        response: { old: true },
        status_code: 200,
        expires_at: past,
        claim_token: "token-A",
      },
    ]);
    const result = await claimPendingStrict(db as never, "k", "t", "u", "/r", 24);
    expect(result.kind).toBe("claimed");
    if (result.kind !== "claimed") throw new Error("expected claimed");
    expect(result.claimToken).not.toBe("token-A");
    expect(db.rows.get("k")?.claim_token).toBe(result.claimToken);
    expect(db.rows.get("k")?.status_code).toBe(0);
  });

  it("late A finalize/release cannot overwrite B after reclaim", async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const db = createMemSupabase([
      {
        key: "same",
        tenant_id: "t",
        user_id: "u",
        route: "/r",
        response: null,
        status_code: 0,
        expires_at: past,
        claim_token: "token-A",
      },
    ]);

    const b = await claimPendingStrict(db as never, "same", "t", "u", "/r", 24);
    expect(b.kind).toBe("claimed");
    if (b.kind !== "claimed") throw new Error("expected B claimed");

    const lateFinalize = await finalizeClaim(
      db as never,
      "same",
      "t",
      "u",
      "/r",
      { from: "A" },
      200,
      24,
      "token-A"
    );
    expect(lateFinalize).toEqual({ ok: false, reason: "not_found" });
    expect(db.rows.get("same")?.claim_token).toBe(b.claimToken);
    expect(db.rows.get("same")?.response).toBeNull();

    const lateRelease = await releaseClaim(db as never, "same", "t", "u", "/r", "token-A");
    expect(lateRelease).toEqual({ ok: false, reason: "not_found" });
    expect(db.rows.has("same")).toBe(true);

    const okFinalize = await finalizeClaim(
      db as never,
      "same",
      "t",
      "u",
      "/r",
      { from: "B" },
      200,
      24,
      b.claimToken
    );
    expect(okFinalize).toEqual({ ok: true });
    expect(db.rows.get("same")?.response).toEqual({ from: "B" });
  });

  it("two concurrent reclaimers: only one claims", async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const db = createMemSupabase([
      {
        key: "same",
        tenant_id: "t",
        user_id: "u",
        route: "/r",
        response: null,
        status_code: 0,
        expires_at: past,
        claim_token: "old",
      },
    ]);

    const [a, b] = await Promise.all([
      claimPendingStrict(db as never, "same", "t", "u", "/r", 24),
      claimPendingStrict(db as never, "same", "t", "u", "/r", 24),
    ]);
    const kinds = [a.kind, b.kind].sort();
    expect(kinds).toEqual(["claimed", "in_flight"]);
  });

  it("finalizeClaim fails on returned update error", async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const db = createMemSupabase([
      {
        key: "k",
        tenant_id: "t",
        user_id: "u",
        route: "/r",
        response: null,
        status_code: 0,
        expires_at: future,
        claim_token: "tok",
      },
    ]);
    db.setUpdateError({ message: "write fail" });
    const result = await finalizeClaim(db as never, "k", "t", "u", "/r", { ok: true }, 200, 24, "tok");
    expect(result).toEqual({ ok: false, reason: "error" });
  });

  it("finalizeClaim fails on affected-row mismatch", async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const db = createMemSupabase([
      {
        key: "k",
        tenant_id: "t",
        user_id: "u",
        route: "/r",
        response: null,
        status_code: 0,
        expires_at: future,
        claim_token: "tok",
      },
    ]);
    db.setUpdateAffectZero();
    const result = await finalizeClaim(db as never, "k", "t", "u", "/r", { ok: true }, 200, 24, "tok");
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("releaseClaim fails on returned delete error", async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const db = createMemSupabase([
      {
        key: "k",
        tenant_id: "t",
        user_id: "u",
        route: "/r",
        response: null,
        status_code: 0,
        expires_at: future,
        claim_token: "tok",
      },
    ]);
    db.setDeleteError({ message: "delete fail" });
    const result = await releaseClaim(db as never, "k", "t", "u", "/r", "tok");
    expect(result).toEqual({ ok: false, reason: "error" });
  });

  it("simultaneous same-key claim: only one claimed", async () => {
    const db = createMemSupabase();
    const [a, b] = await Promise.all([
      claimPendingStrict(db as never, "race", "t", "u", "/r", 24),
      claimPendingStrict(db as never, "race", "t", "u", "/r", 24),
    ]);
    const claimed = [a, b].filter((x) => x.kind === "claimed");
    const other = [a, b].filter((x) => x.kind !== "claimed");
    expect(claimed).toHaveLength(1);
    expect(other[0]?.kind).toBe("in_flight");
  });
});
