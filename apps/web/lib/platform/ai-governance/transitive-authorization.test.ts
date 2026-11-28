import { describe, expect, it } from "vitest";
import {
  evaluateTransitiveAuthorization,
  type AuthorizationHop,
  type AuthorizationMandate,
} from "./transitive-authorization";

const mandate: AuthorizationMandate = {
  tenantId: "tenant-a",
  principalId: "user-origin",
  allowedRecipients: ["agent-a", "agent-b", "agent-c"],
  classification: "restricted",
  purpose: "draft_compare",
};

function hop(
  partial: Partial<AuthorizationHop> & Pick<AuthorizationHop, "agentId">
): AuthorizationHop {
  return {
    tenantId: "tenant-a",
    action: "summarize",
    destination: "same_tenant_ops",
    recipients: [partial.agentId],
    ...partial,
  };
}

describe("evaluateTransitiveAuthorization (D4)", () => {
  it("allows three same-tenant agents within allowed recipients", () => {
    const result = evaluateTransitiveAuthorization(mandate, [
      hop({ agentId: "agent-a" }),
      hop({ agentId: "agent-b" }),
      hop({ agentId: "agent-c" }),
    ]);
    expect(result.decision).toBe("allow");
    expect(result.rule_hits).toContain("transitive_allow");
  });

  it("blocks cross-tenant hop even if agents are individually authorized", () => {
    const result = evaluateTransitiveAuthorization(mandate, [
      hop({ agentId: "agent-a" }),
      hop({ agentId: "agent-b", tenantId: "tenant-b" }),
      hop({ agentId: "agent-c" }),
    ]);
    expect(result.decision).toBe("block");
    expect(result.rule_hits).toContain("cross_tenant_handoff");
    expect(result.rule_hits).toContain("isolated_grant_insufficient");
  });

  it("blocks recipient widening", () => {
    const result = evaluateTransitiveAuthorization(mandate, [
      hop({ agentId: "agent-a", recipients: ["agent-a", "outsider"] }),
    ]);
    expect(result.decision).toBe("block");
    expect(result.rule_hits).toContain("recipient_widened");
  });

  it.each([
    { label: "omitted", recipients: undefined },
    { label: "empty", recipients: [] },
    { label: "allowed agents only", recipients: ["agent-a"] },
  ])(
    "blocks an unlisted hop agent when recipients are $label",
    ({ recipients }) => {
      for (const breakGlass of [false, true]) {
        const result = evaluateTransitiveAuthorization(mandate, [
          hop({ agentId: "outsider", recipients, breakGlass }),
        ]);
        expect(result.decision).toBe("block");
        expect(result.rule_hits).toContain(
          breakGlass ? "break_glass_non_widening" : "recipient_widened"
        );
      }
    }
  );

  it("blocks finance and external destinations", () => {
    expect(
      evaluateTransitiveAuthorization(mandate, [
        hop({ agentId: "agent-a", destination: "finance" }),
      ]).rule_hits
    ).toContain("forbidden_destination");
    expect(
      evaluateTransitiveAuthorization(mandate, [
        hop({ agentId: "agent-a", destination: "external" }),
      ]).rule_hits
    ).toContain("forbidden_destination");
  });

  it("break-glass cannot widen recipients", () => {
    const result = evaluateTransitiveAuthorization(mandate, [
      hop({
        agentId: "agent-a",
        breakGlass: true,
        recipients: ["agent-a", "outsider"],
      }),
    ]);
    expect(result.decision).toBe("block");
    expect(result.rule_hits).toContain("break_glass_non_widening");
  });

  it("blocks classification downgrade across hops", () => {
    const result = evaluateTransitiveAuthorization(mandate, [
      hop({ agentId: "agent-a", classification: "customer_safe" }),
    ]);
    expect(result.decision).toBe("block");
    expect(result.rule_hits).toContain("classification_downgrade");
  });

  it("fails closed on missing mandate or empty chain", () => {
    expect(evaluateTransitiveAuthorization(null, [hop({ agentId: "agent-a" })]).rule_hits).toContain(
      "mandate_missing"
    );
    expect(evaluateTransitiveAuthorization(mandate, []).rule_hits).toContain("handoff_chain_empty");
  });
});
