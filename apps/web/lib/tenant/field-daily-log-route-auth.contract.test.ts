import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const service = readFileSync(
  resolve(__dirname, "../domain/field-daily-log/field-daily-log.service.ts"),
  "utf8"
);

describe("field daily log authorization contract", () => {
  it("lists with the internal reader gate and writes with member+", () => {
    expect(service).toContain("canManageProjects");
    expect(service).toContain("canReadProjects");
    expect(service).toContain("isPortalOnlyStakeholderRole");
    expect(service).toMatch(/function requireReader[\s\S]*canReadProjects/);
    expect(service).toMatch(/function requireWriter[\s\S]*canManageProjects/);
    expect(service).toMatch(/export async function listFieldDailyLogs[\s\S]{0,800}?requireReader/);
    expect(service).toMatch(
      /export async function getFieldDailyLogById[\s\S]{0,800}?requireReader/
    );
    expect(service).toMatch(
      /export async function createFieldDailyLogDraft[\s\S]{0,800}?requireWriter/
    );
    expect(service).toMatch(
      /export async function updateFieldDailyLogDraft[\s\S]{0,800}?requireWriter/
    );
    expect(service).toMatch(
      /export async function confirmFieldDailyLog[\s\S]{0,800}?requireWriter/
    );
  });
});
