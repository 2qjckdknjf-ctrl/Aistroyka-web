import { describe, expect, it } from "vitest";
import { selectRecentPortalActivity } from "./select-recent-portal-activity";

describe("selectRecentPortalActivity", () => {
  it("keeps a newer non-media event ahead of an older photo", () => {
    const photo = {
      id: "photo-old",
      occurredAt: "2026-09-01T08:00:00.000Z",
      eventType: "photo_upload",
      title: "Site photo",
    };
    const request = {
      id: "request-new",
      occurredAt: "2026-09-02T09:00:00.000Z",
      eventType: "client_request",
      title: "Change request",
    };
    const selected = selectRecentPortalActivity([photo, request]);
    expect(selected.map((item) => item.id)).toEqual(["request-new", "photo-old"]);
    expect(selected[0]?.title).toBe("Change request");
  });
});
