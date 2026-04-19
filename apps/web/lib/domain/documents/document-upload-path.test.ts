import { describe, expect, it } from "vitest";
import { buildDocumentUploadObjectPath } from "./document-upload-path";

describe("buildDocumentUploadObjectPath", () => {
  it("builds tenant-scoped path for document upload", () => {
    const path = buildDocumentUploadObjectPath(
      "tenant-123",
      "project-456",
      "PDF",
      "uuid-789"
    );

    expect(path).toBe("tenant-123/project-456/documents/uuid-789.pdf");
  });

  it("falls back to bin extension when extension is invalid", () => {
    const path = buildDocumentUploadObjectPath(
      "tenant-123",
      "project-456",
      "%%%$",
      "uuid-789"
    );

    expect(path).toBe("tenant-123/project-456/documents/uuid-789.bin");
  });
});
