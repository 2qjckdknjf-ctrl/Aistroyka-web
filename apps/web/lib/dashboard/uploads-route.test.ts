import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = process.cwd();
const pagePath = resolve(webRoot, "app/[locale]/(dashboard)/dashboard/uploads/page.tsx");
const canonPath = resolve(webRoot, "app/[locale]/(dashboard)/dashboard/UploadsCanonPage.tsx");
const clientPath = resolve(webRoot, "app/[locale]/(dashboard)/dashboard/UploadsDashboardClient.tsx");

describe("/dashboard/uploads route", () => {
  it("exists and is wired to the upload sessions API", () => {
    expect(existsSync(pagePath)).toBe(true);
    expect(existsSync(canonPath)).toBe(true);
    expect(existsSync(clientPath)).toBe(true);

    const pageSource = readFileSync(pagePath, "utf8");
    const canonSource = readFileSync(canonPath, "utf8");
    const clientSource = readFileSync(clientPath, "utf8");

    expect(pageSource).toContain("UploadsCanonPage");
    expect(canonSource).toContain("UploadsDashboardClient");
    expect(clientSource).toContain("/api/v1/media/upload-sessions");
  });
});
