/** Documents workspace helpers — category/folder chrome (Surface F). */

export const DOCUMENT_FOLDER_TYPES = ["act", "contract", "document"] as const;

export type DocumentFolderType = (typeof DOCUMENT_FOLDER_TYPES)[number];

export type DocumentFolderFilter = "all" | DocumentFolderType;

export function normalizeDocumentFolderType(type: string): DocumentFolderType {
  switch (type) {
    case "act":
      return "act";
    case "contract":
      return "contract";
    default:
      return "document";
  }
}

export function parseDocumentFolderFilter(raw: string | null | undefined): DocumentFolderFilter {
  if (raw === "act" || raw === "contract" || raw === "document") return raw;
  return "all";
}

export function filterDocumentsByFolder<T extends { type: string }>(
  docs: readonly T[],
  folder: DocumentFolderFilter,
): T[] {
  if (folder === "all") return [...docs];
  return docs.filter((doc) => normalizeDocumentFolderType(doc.type) === folder);
}

export function countDocumentsByFolder(
  docs: ReadonlyArray<{ type: string }>,
): Record<DocumentFolderFilter, number> {
  const counts: Record<DocumentFolderFilter, number> = {
    all: docs.length,
    act: 0,
    contract: 0,
    document: 0,
  };
  for (const doc of docs) {
    counts[normalizeDocumentFolderType(doc.type)] += 1;
  }
  return counts;
}

export function countPendingDocumentsInFolder(
  docs: ReadonlyArray<{ type: string; status: string }>,
  folder: DocumentFolderFilter,
): number {
  return filterDocumentsByFolder(docs, folder).filter((doc) => doc.status === "under_review").length;
}
