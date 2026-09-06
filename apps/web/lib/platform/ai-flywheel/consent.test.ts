import { describe, expect, it } from "vitest";
import {
  trainingConsentFilter,
  tenantHasTrainingConsent,
  filterTenantsWithTrainingConsent,
} from "./consent";

describe("training consent", () => {
  it("trainingConsentFilter returns shared consent field", () => {
    const f = trainingConsentFilter();
    expect(f.consentField).toBe("ai_training_consent");
    expect(f.requireExplicitConsent).toBe(true);
  });

  it("tenantHasTrainingConsent defaults to deny", () => {
    expect(tenantHasTrainingConsent(false)).toBe(false);
    expect(tenantHasTrainingConsent(null)).toBe(false);
    expect(tenantHasTrainingConsent(undefined)).toBe(false);
    expect(tenantHasTrainingConsent(true)).toBe(true);
  });

  it("filterTenantsWithTrainingConsent keeps only explicit consent", () => {
    const tenants = [
      { id: "a", ai_training_consent: true },
      { id: "b", ai_training_consent: false },
      { id: "c" },
    ];
    const filtered = filterTenantsWithTrainingConsent(tenants);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("a");
  });
});
