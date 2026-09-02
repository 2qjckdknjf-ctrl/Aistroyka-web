/**
 * Self-serve account deletion (App Store 5.1.1(v) / GDPR).
 * Removes the caller's auth user and memberships. Does not delete tenant projects or reports.
 */

export const ACCOUNT_DELETE_CONFIRM = "DELETE";

export function isAccountDeleteConfirm(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const confirm = (raw as { confirm?: unknown }).confirm;
  return typeof confirm === "string" && confirm.trim() === ACCOUNT_DELETE_CONFIRM;
}

export type AccountDeletionAdmin = {
  from: (table: string) => {
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  auth: {
    admin: {
      deleteUser: (id: string, shouldSoftDelete?: boolean) => Promise<{ error: { message: string } | null }>;
    };
  };
};

/** Memberships and devices only — never projects, reports, or task rows. */
const MEMBERSHIP_TABLES = [
  "device_tokens",
  "user_identities",
  "project_members",
  "tenant_members",
  "account_members",
] as const;

/**
 * Best-effort membership/device cleanup, then Auth soft-delete of the same `userId`.
 * Soft-delete is required: several operational tables reference auth.users with ON DELETE RESTRICT.
 */
export async function deleteOwnAccountRecords(
  admin: AccountDeletionAdmin,
  userId: string
): Promise<{ error: string | null }> {
  const id = userId.trim();
  if (!id) return { error: "user_id required" };

  for (const table of MEMBERSHIP_TABLES) {
    const { error } = await admin.from(table).delete().eq("user_id", id);
    if (error) return { error: error.message };
  }

  const { error } = await admin.auth.admin.deleteUser(id, true);
  if (error) return { error: error.message };
  return { error: null };
}
