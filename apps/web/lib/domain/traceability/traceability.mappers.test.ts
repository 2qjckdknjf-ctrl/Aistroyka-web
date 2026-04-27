import { describe, it, expect } from "vitest";
import {
  mapChangeOrderEvent,
  mapDefectEvent,
  mapDiscussionEntry,
  mapDocumentEvent,
  mapHandoverEvent,
  mapReportApprovalEvent,
  mapServiceRequestEvent,
} from "./traceability.mappers";

describe("traceability mappers", () => {
  it("maps change order events with transition and linked pointers", () => {
    const item = mapChangeOrderEvent(
      "proj-1",
      {
        id: "e1",
        change_order_id: "co-1",
        from_status: "draft",
        to_status: "approved",
        actor_user_id: "u1",
        note: "Client signed",
        created_at: "2026-03-01T12:00:00Z",
      },
      {
        title: "Extra scope",
        linked_discussion_id: "d1",
        linked_document_id: null,
        linked_request_id: "r1",
      }
    );
    expect(item.entityType).toBe("change_order");
    expect(item.previousState).toBe("draft");
    expect(item.newState).toBe("approved");
    expect(item.reasonNote).toBe("Client signed");
    expect(item.linkedPointers.some((p) => p.entityId === "d1" && p.entityType === "discussion")).toBe(
      true
    );
    expect(item.linkedPointers.some((p) => p.entityType === "client_request")).toBe(true);
  });

  it("maps defect events with milestone link", () => {
    const item = mapDefectEvent(
      "proj-1",
      {
        id: "e2",
        defect_id: "def-1",
        from_status: "open",
        to_status: "resolved",
        actor_user_id: "u2",
        note: null,
        created_at: "2026-03-02T12:00:00Z",
      },
      {
        title: "Paint touch-up",
        linked_discussion_id: null,
        linked_document_id: null,
        linked_request_id: null,
        linked_milestone_id: "m1",
      }
    );
    expect(item.entityType).toBe("defect");
    expect(item.linkedPointers[0]?.entityType).toBe("milestone");
  });

  it("maps service request events with handover + defect linkage", () => {
    const item = mapServiceRequestEvent(
      "proj-1",
      {
        id: "e3",
        service_request_id: "sr-1",
        from_status: "reported",
        to_status: "resolved",
        actor_user_id: "u3",
        note: "Warranty fix",
        created_at: "2026-03-03T12:00:00Z",
      },
      {
        title: "Leak in bath",
        linked_handover_id: "h1",
        linked_defect_id: "def-9",
        linked_discussion_id: null,
      }
    );
    expect(item.entityType).toBe("aftercare_request");
    expect(item.linkedPointers.some((p) => p.entityType === "handover")).toBe(true);
    expect(item.linkedPointers.some((p) => p.entityType === "defect" && p.role === "consequence")).toBe(
      true
    );
  });

  it("maps discussion entries to entry id and thread pointer", () => {
    const item = mapDiscussionEntry(
      "proj-1",
      {
        id: "ent-1",
        discussion_id: "disc-1",
        author_user_id: "u4",
        entry_kind: "resolution_note",
        body: "We agree to proceed.",
        created_at: "2026-03-04T12:00:00Z",
      },
      "Scope question"
    );
    expect(item.entityId).toBe("ent-1");
    expect(item.linkedPointers[0]?.entityId).toBe("disc-1");
  });

  it("maps document lifecycle events", () => {
    const item = mapDocumentEvent("proj-1", "doc-1", "Contract A", {
      id: "ev-1",
      event_type: "approved",
      actor_user_id: "u5",
      note: null,
      created_at: "2026-03-05T12:00:00Z",
    });
    expect(item.newState).toBe("approved");
    expect(item.entityType).toBe("document");
  });

  it("maps handover transitions", () => {
    const item = mapHandoverEvent("proj-1", {
      id: "he-1",
      handover_id: "ho-1",
      from_status: "in_progress",
      to_status: "handed_over",
      actor_user_id: "u6",
      note: null,
      created_at: "2026-03-06T12:00:00Z",
    });
    expect(item.entityType).toBe("handover");
    expect(item.previousState).toBe("in_progress");
  });

  it("maps report approval events", () => {
    const item = mapReportApprovalEvent("rep-1", {
      id: "ra-1",
      event_type: "approved",
      actor_user_id: "u7",
      note: "OK",
      created_at: "2026-03-07T12:00:00Z",
    });
    expect(item.entityType).toBe("report_approval");
    expect(item.newState).toBe("approved");
  });
});
