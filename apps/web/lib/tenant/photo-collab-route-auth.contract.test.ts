import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const annotationCreate = readFileSync(
  resolve(__dirname, "../../app/api/v1/media/[mediaId]/annotations/route.ts"),
  "utf8"
);
const annotationUpdate = readFileSync(
  resolve(__dirname, "../../app/api/v1/media/[mediaId]/annotations/[id]/route.ts"),
  "utf8"
);
const commentCreate = readFileSync(
  resolve(__dirname, "../../app/api/v1/media/[mediaId]/comments/route.ts"),
  "utf8"
);

describe("photo collaboration route authorization contract", () => {
  it.each([
    ["annotation create", annotationCreate],
    ["annotation update", annotationUpdate],
    ["comment create", commentCreate],
  ])("requires member+ project-management capability for %s", (_name, source) => {
    expect(source).toContain('canManageProjects } from "@/lib/tenant/tenant.policy"');
    expect(source).toContain("if (!canManageProjects(ctx))");
    expect(source).toContain('error: "Insufficient rights"');
    expect(source).toContain("status: 403");
  });
});
