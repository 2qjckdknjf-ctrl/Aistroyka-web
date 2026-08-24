#!/usr/bin/env bun
import { writeFileSync } from "node:fs";
import {
  GOVERNED_AI_REPOSITORY_FULL_NAME,
  validateDeploymentBinding,
  type GitHubDeploymentRecord,
  type GitHubDeploymentStatusRecord,
} from "./governed-ai-pr-e2e-runner.deployment-binding.ts";

const repositoryFullName = process.env.REPOSITORY_FULL_NAME ?? GOVERNED_AI_REPOSITORY_FULL_NAME;
const targetSha = process.env.TARGET_SHA ?? "";
const deploymentId = process.env.DEPLOYMENT_ID ?? "";
const inputPreviewUrl = process.env.PREVIEW_URL ?? "";
const evidencePath = process.env.DEPLOYMENT_BINDING_EVIDENCE_PATH ?? "deployment-binding-evidence.json";
const githubToken = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";

function fail(message: string, code = "DEPLOYMENT_BINDING_FAILED"): never {
  console.error(`${code}: ${message}`);
  process.exit(1);
}

if (!githubToken) {
  fail("GITHUB_TOKEN is required for deployment binding validation");
}
if (!/^[a-f0-9]{40}$/.test(targetSha)) {
  fail("TARGET_SHA must be exactly 40 lowercase hex characters");
}
if (!deploymentId) {
  fail("DEPLOYMENT_ID is required");
}
if (!inputPreviewUrl) {
  fail("PREVIEW_URL is required");
}

const [owner, repo] = repositoryFullName.split("/");
if (!owner || !repo) {
  fail("REPOSITORY_FULL_NAME must be owner/repo");
}

const deploymentApiUrl = `https://api.github.com/repos/${owner}/${repo}/deployments/${deploymentId}`;
const deploymentRes = await fetch(deploymentApiUrl, {
  headers: {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${githubToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
  },
});
if (!deploymentRes.ok) {
  fail(`GitHub deployment fetch failed with HTTP ${deploymentRes.status}`);
}
const deployment = (await deploymentRes.json()) as GitHubDeploymentRecord;

const statusesRes = await fetch(`${deploymentApiUrl}/statuses`, {
  headers: {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${githubToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
  },
});
if (!statusesRes.ok) {
  fail(`GitHub deployment statuses fetch failed with HTTP ${statusesRes.status}`);
}
const statuses = (await statusesRes.json()) as GitHubDeploymentStatusRecord[];

const result = validateDeploymentBinding({
  repositoryFullName,
  targetSha,
  deploymentId,
  inputPreviewUrl,
  deployment,
  statuses,
});

if (!result.ok) {
  fail(result.message, result.code);
}

writeFileSync(evidencePath, JSON.stringify(result.evidence, null, 2));
process.stdout.write(result.canonicalPreviewUrl);
