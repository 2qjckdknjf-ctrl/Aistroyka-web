/**
 * POST /api/invite — invite by email (delegates to tenant invite).
 * Body: { email: string, role?: "admin"|"member"|"viewer", project?: string (optional) }
 * Same contract as /api/tenant/invite; project is optional for future per-project invites.
 */
export { POST } from "@/app/api/tenant/invite/route";
