import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  getTrainingConsent,
  updateTrainingConsent,
} from "./training-consent.service";

describe("training consent service", () => {
  it("getTrainingConsent returns false by default", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { ai_training_consent: false },
              error: null,
            }),
          }),
        }),
      }),
    };
    const state = await getTrainingConsent(supabase as never, "t1");
    expect(state?.aiTrainingConsent).toBe(false);
  });

  it("updateTrainingConsent writes audit on change", async () => {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "tenants") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { ai_training_consent: false },
                  error: null,
                }),
              }),
            }),
            update,
          };
        }
        if (table === "audit_logs") return { insert };
        return {};
      }),
    };

    const result = await updateTrainingConsent(supabase as never, {
      tenantId: "t1",
      userId: "u1",
      consent: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.aiTrainingConsent).toBe(true);
    expect(update).toHaveBeenCalled();
    expect(insert).toHaveBeenCalled();
  });
});
