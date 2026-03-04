import type { SupabaseClient } from "@supabase/supabase-js";
import type { Report } from "./report.types";
export async function create(supabase: SupabaseClient, tenantId: string, userId: string): Promise<Report | null> { return null; }
export async function getById(supabase: SupabaseClient, reportId: string, tenantId: string): Promise<Report | null> { return null; }
