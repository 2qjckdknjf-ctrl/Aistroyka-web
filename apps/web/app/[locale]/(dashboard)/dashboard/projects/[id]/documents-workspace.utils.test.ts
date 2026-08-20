import { describe, expect, it } from "vitest";
import {
  countDocumentsByFolder,
  countPendingDocumentsInFolder,
  filterDocumentsByFolder,
  normalizeDocumentFolderType,
  parseDocumentFolderFilter,
} from "./documents-workspace.utils";

describe("documents-workspace.utils", () => {
  it("normalizes unknown types into the generic document folder", () => {
    expect(normalizeDocumentFolderType("act")).toBe("act");
    expect(normalizeDocumentFolderType("drawing")).toBe("document");
  });

  it("parses folder filter from query values", () => {
    expect(parseDocumentFolderFilter("contract")).toBe("contract");
    expect(parseDocumentFolderFilter("xyz")).toBe("all");
  });

  it("filters and counts by folder", () => {
    const docs = [
      { type: "act", status: "under_review" },
      { type: "contract", status: "approved" },
      { type: "other", status: "under_review" },
    ];
    expect(filterDocumentsByFolder(docs, "act")).toHaveLength(1);
    expect(countDocumentsByFolder(docs)).toEqual({ all: 3, act: 1, contract: 1, document: 1 });
    expect(countPendingDocumentsInFolder(docs, "all")).toBe(2);
    expect(countPendingDocumentsInFolder(docs, "document")).toBe(1);
  });
});
