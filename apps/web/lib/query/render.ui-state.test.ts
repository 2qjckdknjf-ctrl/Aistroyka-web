/**
 * UI-state contract for dashboard/admin QueryBoundary error mapping.
 * Pure helpers — no live network / no JSX module load.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mapQueryErrorToUI } from "./mapQueryErrorToUI";
import { normalizeToQueryError } from "@/lib/engine/normalizeError";
import type { EngineError } from "@/lib/engine/errors";

function engine(partial: Partial<EngineError> & Pick<EngineError, "message" | "status" | "kind">): EngineError {
  return {
    requestId: "",
    retryable: false,
    ...partial,
  };
}

describe("mapQueryErrorToUI (dashboard/admin empty/loading/error contract)", () => {
  it("maps populated EngineError message for 401", () => {
    const err = normalizeToQueryError(
      engine({ kind: "unauthorized", status: 401, message: "Unauthorized" })
    );
    const mapped = mapQueryErrorToUI(err);
    expect(mapped.message).toBe("Unauthorized");
    expect(mapped.engineError).not.toBeNull();
    expect(mapped.message).not.toMatch(/SELECT |stack|supabase|service.?role/i);
  });

  it("maps 403 without leaking internals", () => {
    const err = normalizeToQueryError(
      engine({ kind: "unauthorized", status: 403, message: "Forbidden" })
    );
    const mapped = mapQueryErrorToUI(err);
    expect(mapped.message).toBe("Forbidden");
    expect(mapped.message).not.toContain("tenant_id");
  });

  it("maps 5xx EngineError", () => {
    const err = normalizeToQueryError(
      engine({ kind: "unknown", status: 500, message: "Server error" })
    );
    const mapped = mapQueryErrorToUI(err);
    expect(mapped.message).toBe("Server error");
  });

  it("maps generic Error / network failure", () => {
    const mapped = mapQueryErrorToUI(new Error("Network failed"));
    expect(mapped.message).toBe("Network failed");
    expect(mapped.engineError).toBeNull();
  });

  it("maps malformed/unknown payloads to a safe generic message", () => {
    const mapped = mapQueryErrorToUI({ weird: true });
    expect(mapped.message).toBe("Something went wrong.");
  });

  it("does not treat authorization failures as empty-state copy", () => {
    const mapped = mapQueryErrorToUI(
      normalizeToQueryError(engine({ kind: "unauthorized", status: 403, message: "Forbidden" }))
    );
    expect(mapped.message.length).toBeGreaterThan(0);
    expect(mapped.message.toLowerCase()).not.toBe("no data");
  });
});

describe("ErrorState accessibility contract (source)", () => {
  it("ErrorState uses role=alert and labeled Retry", () => {
    const src = readFileSync(resolve(__dirname, "../../components/ui/ErrorState.tsx"), "utf8");
    expect(src).toContain('role="alert"');
    expect(src).toContain("Retry");
    expect(src).toContain("onRetry");
  });
});
