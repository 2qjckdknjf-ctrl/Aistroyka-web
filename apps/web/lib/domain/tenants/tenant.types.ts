export interface Tenant { id: string; name: string; plan?: string; user_id?: string; created_at?: string; }
export interface TenantMember { tenant_id: string; user_id: string; role: string; created_at?: string; }
export type TenantRole = "owner" | "admin" | "member" | "viewer";
