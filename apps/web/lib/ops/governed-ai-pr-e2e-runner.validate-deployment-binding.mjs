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

function parseLinkNext(linkHeader: string | null): string | null {
  if (!linkHeader) {
    return null;
  }
  for (const part of linkHeader.split(",")) {
    const section = part.trim();
    if (section.endsWith('rel="next"')) {
      const match = section.match(/<([^>]+)>/);
      return match?.[1] ?? null;
    }
  }
  return null;
}

async function fetchAllDeploymentStatuses(
  deploymentApiUrl: string,
  token: string,
): Promise<{ statuses: GitHubDeploymentStatusRecord[]; fullyPaginated: boolean }> {
  const statuses: GitHubDeploymentStatusRecord[] = [];
  let nextUrl: string | null = `${deploymentApiUrl}/statuses?per_page=100`;
  let pages = 0;
  const maxPages = 20;

  while (nextUrl) {
    pages += 1;
    if (pages > maxPages) {
      return { statuses, fullyPaginated: false };
    }
    const res = await fetch(nextUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) {
      fail(`GitHub deployment statuses fetch failed with HTTP ${res.status}`);
    }
    const batch = (await res.json()) as GitHubDeploymentStatusRecord[];
    statuses.push(...batch);
    nextUrl = parseLinkNext(res.headers.get("link"));
  }

  return { statuses, fullyPaginated: true };
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

const { statuses, fullyPaginated } = await fetchAllDeploymentStatuses(deploymentApiUrl, githubToken);

const result = validateDeploymentBinding({
  repositoryFullName,
  targetSha,
  deploymentId,
  inputPreviewUrl,
  deployment,
  statuses,
  statusesFullyPaginated: fullyPaginated,
});

if (!result.ok) {
  fail(result.message, result.code);
}

writeFileSync(evidencePath, JSON.stringify(result.evidence, null, 2));
process.stdout.write(result.canonicalPreviewUrl);
