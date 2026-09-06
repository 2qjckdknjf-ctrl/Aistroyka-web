import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const respondRoute = readFileSync(
  resolve(
    __dirname,
    "../../app/api/v1/projects/[id]/client-requests/[requestId]/respond/route.ts"
  ),
  "utf8"
);

const estimateService = readFileSync(
  resolve(__dirname, "../domain/customer-estimates/customer-estimates.service.ts"),
  "utf8"
);

describe("customer decision service-role writer contract", () => {
  it("direct client-request respond fails closed without admin writer", () => {
    expect(respondRoute).toContain("const admin = getAdminClient()");
    expect(respondRoute).toContain('error: "Service writer unavailable"');
    expect(respondRoute).toContain(
      "respondToClientRequest(admin, ctx, projectId, requestId, input)"
    );
    expect(respondRoute).not.toContain(
      "respondToClientRequest(supabase, ctx, projectId, requestId, input)"
    );
  });

  it("estimate-linked client decision uses the same service writer", () => {
    expect(estimateService).toContain("const writer = getAdminClient()");
    expect(estimateService).toContain('error: "Service writer unavailable"');
    expect(estimateService).toContain(
      "respondToClientRequest(writer, ctx, projectId, row.linked_decision_request_id"
    );
    expect(estimateService).not.toContain(
      "respondToClientRequest(supabase, ctx, projectId, row.linked_decision_request_id"
    );
  });
});
