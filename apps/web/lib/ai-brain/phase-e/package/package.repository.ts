/**
 * AI Brain Phase E — Package repository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiVersionRef } from "../../phase-d/run/run.types";
import type {
  AiOptimizationPackage,
  PackageType,
  ProposalReviewStatus,
} from "../types";

export interface CreatePackageInput {
  proposalId: string;
  packageType: PackageType;
  baselineVersionRefs?: AiVersionRef[];
  candidateVersionRefs?: AiVersionRef[];
  changedComponents?: string[];
  validationRequirements?: string[];
  approvalRequired?: boolean;
}

export async function createPackage(
  supabase: SupabaseClient,
  input: CreatePackageInput
): Promise<AiOptimizationPackage | null> {
  const { data, error } = await supabase
    .from("ai_optimization_packages")
    .insert({
      proposal_id: input.proposalId,
      package_type: input.packageType,
      baseline_version_refs: (input.baselineVersionRefs ?? []) as unknown[],
      candidate_version_refs: (input.candidateVersionRefs ?? []) as unknown[],
      changed_components: input.changedComponents ?? [],
      validation_requirements: input.validationRequirements ?? [],
      approval_required: input.approvalRequired ?? true,
      review_status: "pending",
    })
    .select("id, proposal_id, package_type, baseline_version_refs, candidate_version_refs, changed_components, validation_requirements, approval_required, review_status, created_at")
    .single();

  if (error || !data) return null;

  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    proposalId: d.proposal_id as string,
    packageType: d.package_type as PackageType,
    baselineVersionRefs: (d.baseline_version_refs as AiVersionRef[]) ?? [],
    candidateVersionRefs: (d.candidate_version_refs as AiVersionRef[]) ?? [],
    changedComponents: (d.changed_components as string[]) ?? [],
    validationRequirements: (d.validation_requirements as string[]) ?? [],
    approvalRequired: (d.approval_required as boolean) ?? true,
    reviewStatus: (d.review_status as ProposalReviewStatus) ?? "pending",
    createdAt: d.created_at as string,
  };
}

export async function listPackagesByProposal(
  supabase: SupabaseClient,
  proposalId: string
): Promise<AiOptimizationPackage[]> {
  const { data, error } = await supabase
    .from("ai_optimization_packages")
    .select("id, proposal_id, package_type, baseline_version_refs, candidate_version_refs, changed_components, validation_requirements, approval_required, review_status, created_at")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((d) => ({
    id: d.id as string,
    proposalId: d.proposal_id as string,
    packageType: d.package_type as PackageType,
    baselineVersionRefs: (d.baseline_version_refs as AiVersionRef[]) ?? [],
    candidateVersionRefs: (d.candidate_version_refs as AiVersionRef[]) ?? [],
    changedComponents: (d.changed_components as string[]) ?? [],
    validationRequirements: (d.validation_requirements as string[]) ?? [],
    approvalRequired: (d.approval_required as boolean) ?? true,
    reviewStatus: (d.review_status as ProposalReviewStatus) ?? "pending",
    createdAt: d.created_at as string,
  }));
}

export async function getPackageById(
  supabase: SupabaseClient,
  packageId: string
): Promise<AiOptimizationPackage | null> {
  const { data, error } = await supabase
    .from("ai_optimization_packages")
    .select("*")
    .eq("id", packageId)
    .maybeSingle();
  if (error || !data) return null;
  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    proposalId: d.proposal_id as string,
    packageType: d.package_type as PackageType,
    baselineVersionRefs: (d.baseline_version_refs as AiVersionRef[]) ?? [],
    candidateVersionRefs: (d.candidate_version_refs as AiVersionRef[]) ?? [],
    changedComponents: (d.changed_components as string[]) ?? [],
    validationRequirements: (d.validation_requirements as string[]) ?? [],
    approvalRequired: (d.approval_required as boolean) ?? true,
    reviewStatus: (d.review_status as ProposalReviewStatus) ?? "pending",
    createdAt: d.created_at as string,
  };
}
