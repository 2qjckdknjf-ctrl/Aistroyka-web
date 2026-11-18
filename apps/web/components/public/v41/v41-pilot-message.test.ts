import { describe, expect, it } from "vitest";
import { buildPilotLeadPayload } from "./v41-pilot-message";

describe("buildPilotLeadPayload", () => {
  it("maps pilot fields onto the contact API contract", () => {
    expect(
      buildPilotLeadPayload({
        name: "  Ivan  ",
        email: " ivan@company.com ",
        company: " Stroy Group ",
        objectsRange: "1–3",
      }),
    ).toEqual({
      name: "Ivan",
      email: "ivan@company.com",
      company: "Stroy Group",
      message: "Pilot request. Active objects: 1–3",
    });
  });

  it("appends optional plan and scenario fields without changing the contact contract", () => {
    expect(
      buildPilotLeadPayload({
        name: "Ivan",
        email: "ivan@company.com",
        company: "Stroy Group",
        objectsRange: "1–3",
        plan: "enterprise",
        role: "PM",
        channel: "Email",
        goals: "Daily reports",
      }).message,
    ).toBe(
      "Pilot request. Active objects: 1–3 Plan: enterprise Role: PM Channel: Email Goals: Daily reports",
    );
  });
});
