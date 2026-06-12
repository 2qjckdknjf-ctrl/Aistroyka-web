/**
 * Supabase RPC integration layer.
 * All tenant-scoped data access goes through the Supabase client; RLS enforces isolation.
 * When backend exposes RPCs (e.g. create_project, upload_media), replace the implementation
 * below with supabase.rpc('rpc_name', params) and keep the same function signatures.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project } from "@/lib/types";

/** Create a project for the current user. When available, call RPC: create_project(p_name text) returns uuid */
export async function createProject(
  supabase: SupabaseClient,
  name: string
): Promise<{ id: string } | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("projects")
    .insert({ name: name.trim(), user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

/** List projects for the current user. When available, call RPC: get_projects_for_user() returns setof project */
export async function listProjectsForUser(
  supabase: SupabaseClient
): Promise<{ data: Pick<Project, "id" | "name" | "created_at">[] | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { data, error: error?.message ?? null };
}

/** Get a single project by id if owned by current user. RLS enforces tenant isolation. */
export async function getProjectById(
  supabase: SupabaseClient,
  projectId: string
): Promise<{ data: { id: string; name: string; user_id: string } | null; error: string | null }> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, user_id")
    .eq("id", projectId)
    .single();

  return { data, error: error?.message ?? null };
}

/**
 * Trigger AI analysis for a job. RPC: trigger_analysis(p_job_id uuid) returns void or boolean.
 * Backend must implement this RPC to enqueue/start the analysis.
 */
export async function triggerAnalysis(
  supabase: SupabaseClient,
  projectId: string,
  jobId: string
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) return { error: "Project not found" };

  const { error } = await supabase.rpc("trigger_analysis", { p_job_id: jobId });
  return { error: error?.message ?? null };
}
