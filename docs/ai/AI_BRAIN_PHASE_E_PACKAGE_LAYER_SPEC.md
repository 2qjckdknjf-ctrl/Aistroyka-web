# AI Brain Phase E — Package Layer Spec

## Overview

Packages bundle a specific optimization attempt into a reviewable artifact. Packages remain inactive unless explicitly approved.

## Package Types

- planner_rule
- prompt_adjustment
- policy_tweak
- memory_threshold
- output_contract
- grader_config
- eval_config

## Contents

- baselineVersionRefs — Current version refs
- candidateVersionRefs — Proposed version refs
- changedComponents — List of changed layers
- validationRequirements — Prerequisites (e.g. eval_run, no_regression)
- approvalRequired — Always true by default

## API

- `createPackageFromProposal(supabase, proposalId, packageType, overrides?)` — From proposal
- `createPackage(supabase, input)` — Direct create
- `listPackagesByProposal(supabase, proposalId)` — By proposal
- `getPackageById(supabase, packageId)` — Single fetch
