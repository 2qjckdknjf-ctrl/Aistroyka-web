import { z } from "zod";

export const TenantMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.string(),
  created_at: z.string(),
  is_owner: z.boolean().optional(),
});

export const TenantMembersResponseSchema = z.object({
  data: z.array(TenantMemberSchema),
});
