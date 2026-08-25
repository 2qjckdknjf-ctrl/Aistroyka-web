import { describe, expect, it } from "vitest";
import {
  buildNotificationHref,
  countNotificationsByReadState,
  filterNotificationsByReadState,
  parseNotificationReadFilter,
  sortNotificationsByAttention,
} from "./notifications-workspace.utils";

describe("notifications-workspace.utils", () => {
  it("parses read filter and builds hrefs", () => {
    expect(parseNotificationReadFilter(null)).toBe("all");
    expect(parseNotificationReadFilter("unread")).toBe("unread");
    expect(buildNotificationHref({ target_type: "task", target_id: "t1" })).toBe(
      "/dashboard/tasks/t1",
    );
    expect(buildNotificationHref({ target_type: "issue", target_id: "iss-1", project_id: "p1" })).toBe(
      "/dashboard/projects/p1?tab=issues",
    );
    expect(buildNotificationHref({ target_type: "issue", target_id: "iss-1" })).toBe("/dashboard");
    expect(buildNotificationHref({})).toBe("/dashboard");
  });

  it("filters and counts unread/read", () => {
    const items = [
      { id: "1", created_at: "2026-08-20T10:00:00Z", read_at: null },
      { id: "2", created_at: "2026-08-19T10:00:00Z", read_at: "2026-08-19T11:00:00Z" },
    ];
    expect(filterNotificationsByReadState(items, "unread")).toHaveLength(1);
    expect(countNotificationsByReadState(items)).toEqual({ all: 2, unread: 1, read: 1 });
  });

  it("sorts unread before older read", () => {
    const sorted = sortNotificationsByAttention([
      { id: "old-unread", created_at: "2026-08-18T10:00:00Z", read_at: null },
      { id: "new-read", created_at: "2026-08-21T10:00:00Z", read_at: "2026-08-21T11:00:00Z" },
    ]);
    expect(sorted.map((n) => n.id)).toEqual(["old-unread", "new-read"]);
  });
});
