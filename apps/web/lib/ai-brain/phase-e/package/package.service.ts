/**
 * AI Brain Phase E — Package service.
 * Bundles optimization attempts into reviewable artifacts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { captureVersionRefs } from "../../phase-d/versioning/version-refs";
import { getProposalById } from "../proposal/proposal.repository";
import { createPackage, listPackagesByProposal, getPackageById } from "./package.repository";
import type { CreatePackageInput } from "./package.repository";
import type { PackageType } from "../types";
import { PACKAGE_TYPES } from "../types";

export type CreatePackageResult =
  | { success: true; packageId: string }
  | { success: false; error: string };

export function validatePackageType(v: unknown): v is PackageType {
  return typeof v === "string" && PACKAGE_TYPES.includes(v as PackageType);
}

export async function createPackageFromProposal(
  supabase: SupabaseClient,
  proposalId: string,
  packageType: PackageType,
  overrides?: Partial<CreatePackageInput>
): Promise<CreatePackageResult> {
  const proposal = await getProposalById(supabase, proposalId);
  if (!proposal) {
    return { success: false, error: "Proposal not found" };
  }

  const baselineRefs = overrides?.baselineVersionRefs ?? captureVersionRefs();
  const candidateRefs = overrides?.candidateVersionRefs ?? captureVersionRefs();

  const pkg = await createPackage(supabase, {
    proposalId,
    packageType,
    baselineVersionRefs: baselineRefs,
    candidateVersionRefs: candidateRefs,
    changedComponents: overrides?.changedComponents ?? [proposal.targetLayer],
    validationRequirements: overrides?.validationRequirements ?? ["eval_run", "no_regression"],
    approvalRequired: overrides?.approvalRequired ?? true,
    ...overrides,
  });

  if (!pkg) {
    return { success: false, error: "Failed to create package" };
  }
  return { success: true, packageId: pkg.id };
}

export { createPackage, listPackagesByProposal, getPackageById };
