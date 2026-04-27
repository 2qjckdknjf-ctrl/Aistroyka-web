export type OwnerGateOutcome = "allow" | "deny";

export type OwnerGateReason =
  | "no_session"
  | "no_grant"
  | "ip_blocked"
  | "host_blocked"
  | "header_required"
  | "header_mismatch"
  | "supabase_error"
  | "session_stale"
  | "readonly_blocked"
  | "rate_limited"
  | "surface_invalid";

export function logOwnerGateEvent(input: {
  outcome: OwnerGateOutcome;
  reason?: OwnerGateReason;
  path: string;
  userId: string | null;
  clientIp: string | null;
  isApi: boolean;
  role?: string;
}): void {
  const line = JSON.stringify({
    type: "owner_gate",
    ts: new Date().toISOString(),
    ...input,
  });
  if (input.outcome === "allow") {
    console.info(line);
    return;
  }
  console.warn(line);
}
