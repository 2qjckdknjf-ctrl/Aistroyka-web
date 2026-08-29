import { describe, expect, it, vi } from "vitest";
import { insertContactLead, isMissingAttributionColumn } from "./contact-lead-submit";

describe("isMissingAttributionColumn", () => {
  it("detects PostgREST schema-cache misses so inserts can fall back", () => {
    expect(
      isMissingAttributionColumn({
        code: "PGRST204",
        message: "Could not find the 'utm_source' column of 'contact_leads' in the schema cache",
      }),
    ).toBe(true);
    expect(isMissingAttributionColumn({ message: "duplicate key value" })).toBe(false);
  });
});

describe("insertContactLead", () => {
  it("retries without attribution columns when the schema is not migrated yet", async () => {
    const insert = vi
      .fn()
      .mockResolvedValueOnce({
        error: {
          code: "PGRST204",
          message: "Could not find the 'utm_source' column of 'contact_leads' in the schema cache",
        },
      })
      .mockResolvedValueOnce({ error: null });
    const admin = {
      from: vi.fn(() => ({ insert })),
    };
    const result = await insertContactLead(admin as never, {
      name: "Jane",
      email: "jane@example.com",
      message: "Hello",
      attribution: { utm_source: "google", locale: "en" },
    });
    expect(result.error).toBeNull();
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[0]?.[0]).toMatchObject({ utm_source: "google" });
    expect(insert.mock.calls[1]?.[0]).not.toHaveProperty("utm_source");
  });
});
