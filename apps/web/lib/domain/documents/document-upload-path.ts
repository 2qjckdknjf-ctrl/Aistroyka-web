/**
 * Build tenant-scoped storage path for project document uploads.
 * Keeps uploads inside tenant prefix to satisfy storage RLS policies.
 */
export function buildDocumentUploadObjectPath(
  tenantId: string,
  projectId: string,
  extension: string,
  randomId: string
): string {
  const cleanExt = (extension || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${tenantId}/${projectId}/documents/${randomId}.${cleanExt}`;
}
