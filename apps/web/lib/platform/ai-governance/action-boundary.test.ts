import { describe, expect, it } from "vitest";
import {
  ACTION_BOUNDARY_POLICY_VERSION,
  denyProtectedAcrossTransports,
  evaluateActionBoundary,
  type ActionTransport,
} from "./action-boundary";

const authorized = {
  principalId: "user-1",
  tenantId: "tenant-a",
  authorized: true as const,
};

const TRANSPORTS: ActionTransport[] = [
  "mcp",
  "api",
  "shell",
  "filesystem",
  "browser",
  "delegated_agent",
];

describe("evaluateActionBoundary (2026-11-27 P0)", () => {
  it("fails closed when identity is unknown", () => {
    const result = evaluateActionBoundary({
      principal: { principalId: null, tenantId: "tenant-a", authorized: true },
      resourceClass: "public",
      operation: "read",
      transport: "api",
    });
    expect(result.decision).toBe("deny");
    expect(result.rule_hits).toContain("identity_unknown");
    expect(result.policy_version).toBe(ACTION_BOUNDARY_POLICY_VERSION);
    expect(result.audit.policy_version).toBe(ACTION_BOUNDARY_POLICY_VERSION);
  });

  it("fails closed when authorization is unknown", () => {
    const result = evaluateActionBoundary({
      principal: { principalId: "user-1", tenantId: "tenant-a", authorized: null },
      resourceClass: "public",
      operation: "read",
      transport: "mcp",
    });
    expect(result.decision).toBe("deny");
    expect(result.rule_hits).toContain("authorization_unknown_or_denied");
  });

  it("denies finance/secrets/customer_data via shell/filesystem/browser/delegated_agent", () => {
    for (const resourceClass of ["secrets", "finance", "customer_data"] as const) {
      const byTransport = denyProtectedAcrossTransports({
        principal: authorized,
        resourceClass,
        resourceId: "res-1",
        operation: "read",
      });
      for (const transport of ["shell", "filesystem", "browser", "delegated_agent"] as const) {
        expect(byTransport[transport].decision).toBe("deny");
        expect(byTransport[transport].rule_hits).toContain("protected_resource_denied");
        expect(byTransport[transport].rule_hits).toContain(`transport_${transport}`);
        expect(byTransport[transport].audit.transport).toBe(transport);
        expect(byTransport[transport].audit.resource_class).toBe(resourceClass);
      }
    }
  });

  it("denies the same protected resource consistently across all transports for exfiltrate", () => {
    const byTransport = denyProtectedAcrossTransports({
      principal: authorized,
      resourceClass: "customer_data",
      operation: "exfiltrate",
    });
    for (const transport of TRANSPORTS) {
      expect(byTransport[transport].decision).toBe("deny");
      expect(byTransport[transport].rule_hits).toContain("protected_resource_denied");
    }
  });

  it("denies secret/finance mutation on MCP and API equally", () => {
    for (const transport of ["mcp", "api"] as const) {
      for (const operation of ["write", "execute", "delegate"] as const) {
        const result = evaluateActionBoundary({
          principal: authorized,
          resourceClass: "secrets",
          operation,
          transport,
        });
        expect(result.decision).toBe("deny");
        expect(result.rule_hits).toContain("protected_mutation_denied");
        expect(result.rule_hits).toContain(`transport_${transport}`);
      }
    }
  });

  it("blocks synthetic secret-shaped payload on every transport before egress", () => {
    const synthetic = ["sk", "abcdefghijklmnopqrstuvwxyz012345"].join("-");
    for (const transport of TRANSPORTS) {
      const result = evaluateActionBoundary({
        principal: authorized,
        resourceClass: "public",
        operation: "read",
        transport,
        payloadText: `note ${synthetic}`,
      });
      expect(result.decision).toBe("deny");
      expect(result.rule_hits).toContain("synthetic_secret_in_payload");
      expect(result.rule_hits).toContain(`transport_${transport}`);
    }
  });

  it("allows authorized public read on MCP/API without secrets in payload", () => {
    for (const transport of ["mcp", "api"] as const) {
      const result = evaluateActionBoundary({
        principal: authorized,
        resourceClass: "public",
        operation: "read",
        transport,
        payloadText: "status ok",
      });
      expect(result.decision).toBe("allow");
      expect(result.rule_hits).toContain("action_boundary_allow");
      expect(result.audit.principal_id).toBe("user-1");
      expect(result.audit.tenant_id).toBe("tenant-a");
    }
  });

  it("denies admin delegate on any transport", () => {
    const result = evaluateActionBoundary({
      principal: authorized,
      resourceClass: "tenant_admin",
      operation: "delegate",
      transport: "delegated_agent",
    });
    expect(result.decision).toBe("deny");
    expect(result.rule_hits).toContain("admin_delegate_denied");
  });
});
