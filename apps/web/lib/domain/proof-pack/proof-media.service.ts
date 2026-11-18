import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAIMediaImage } from "@/lib/platform/ai/resolve-ai-media-image";
import { downloadPrivateOriginal } from "@/lib/platform/media/private-original-download";
import { includeMediaInPublicProof } from "./proof-pack.service";
import type { Media } from "@/lib/domain/media/media.types";
export class ProofMediaError extends Error {
  constructor(public status: number) { super("Shared photo unavailable"); }
}
type Share = { tenant_id: string; project_id: string; expires_at: string | null; revoked_at: string | null };
async function authorize(admin: SupabaseClient, token: string): Promise<Share> {
  const { data, error } = await admin.from("proof_pack_shares").select("tenant_id,project_id,expires_at,revoked_at").eq("token", token).maybeSingle();
  if (error) throw new ProofMediaError(503);
  if (!data || data.revoked_at || (data.expires_at && !(new Date(data.expires_at).getTime() > Date.now()))) throw new ProofMediaError(404);
  const tenant = await admin.from("tenants").select("account_id").eq("id", data.tenant_id).maybeSingle();
  if (tenant.error) throw new ProofMediaError(503);
  if (!tenant.data?.account_id) throw new ProofMediaError(404);
  const account = await admin.from("accounts").select("status").eq("id", tenant.data.account_id).maybeSingle();
  if (account.error) throw new ProofMediaError(503);
  if (account.data?.status !== "active") throw new ProofMediaError(404);
  return data;
}
async function mediaSource(admin: SupabaseClient, share: Share, id: string): Promise<Media> {
  // Match the pack's current bounded selection, not every media UUID in its project.
  const selection = await admin.from("media").select("id,type").eq("tenant_id", share.tenant_id).eq("project_id", share.project_id)
    .order("uploaded_at", { ascending: false }).order("id", { ascending: false }).limit(30);
  if (selection.error) throw new ProofMediaError(503);
  if (!(selection.data ?? []).some(row => row.id === id && includeMediaInPublicProof(row))) throw new ProofMediaError(404);
  const { data, error } = await admin.from("media").select("id,tenant_id,project_id,type,file_url").eq("id", id).eq("tenant_id", share.tenant_id).eq("project_id", share.project_id).maybeSingle();
  if (error) throw new ProofMediaError(503);
  if (!data || !includeMediaInPublicProof(data)) throw new ProofMediaError(404);
  return data;
}
/** Explicit project share capability; never redirect to a durable private object URL. */
export async function downloadSharedProofMedia(admin: SupabaseClient, token: string, mediaId: string) {
  const share = await authorize(admin, token);
  const source = await mediaSource(admin, share, mediaId);
  const resolved = await resolveAIMediaImage(admin, { tenantId: share.tenant_id, projectIdClaim: share.project_id, mediaId });
  if (!resolved.ok) throw new ProofMediaError(resolved.retryable ? 503 : 404);
  if (resolved.trustedProjectId !== share.project_id) throw new ProofMediaError(404);
  const { data: blob, error } = await downloadPrivateOriginal(admin, resolved.objectPath, 20 * 1024 * 1024);
  if (error || !blob) throw new ProofMediaError(error?.status === 413 ? 415 : 503);
  const current = await authorize(admin, token);
  if (current.tenant_id !== share.tenant_id || current.project_id !== share.project_id) throw new ProofMediaError(404);
  const currentSource = await mediaSource(admin, current, mediaId);
  if (currentSource.file_url !== source.file_url || currentSource.type !== source.type) throw new ProofMediaError(404);
  if (blob.size > 20 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(blob.type)) throw new ProofMediaError(415);
  return blob;
}
