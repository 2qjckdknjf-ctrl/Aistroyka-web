/**
 * Maps Supabase/PostgREST errors for tenant_invitations to safe API responses.
 */

export function mapInvitationDbError(error: { message?: string; code?: string }): { status: number; message: string } | null {
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";

  if (
    msg.includes("schema cache") ||
    (msg.includes("could not find") && msg.includes("tenant_invitations")) ||
    code === "42P01"
  ) {
    return {
      status: 503,
      message:
        "Team invitations are not available on this environment yet. Apply the latest database migrations (tenant_invitations), then retry.",
    };
  }

  return null;
}
