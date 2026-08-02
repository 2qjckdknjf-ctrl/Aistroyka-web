import type { Page, Response } from "@playwright/test";

export type NetworkIssue = {
  url: string;
  method: string;
  status: number;
  latencyMs?: number;
};

export type NetworkMonitorReport = {
  issues: NetworkIssue[];
  slowRequests: NetworkIssue[];
  duplicateKeys: string[];
  totalApiCalls: number;
};

const SLOW_THRESHOLD_MS = Number(process.env.QA_SLOW_API_MS ?? 3000);

const IGNORED_STATUSES: Array<{ status: number; urlPattern: RegExp }> = [
  { status: 401, urlPattern: /\/api\/v1\/help\/assistant\/metrics/ },
  { status: 503, urlPattern: /\/api\/v1\/devices/ },
  { status: 404, urlPattern: /\/favicon\.ico/ },
];

function shouldIgnore(status: number, url: string): boolean {
  return IGNORED_STATUSES.some((r) => r.status === status && r.urlPattern.test(url));
}

export function attachNetworkMonitor(page: Page) {
  const issues: NetworkIssue[] = [];
  const slowRequests: NetworkIssue[] = [];
  const requestTimings = new Map<string, number>();
  const requestCounts = new Map<string, number>();
  let totalApiCalls = 0;

  const onRequest = (request: { url(): string; method(): string }) => {
    const url = request.url();
    if (!url.includes("/api/")) return;
    requestTimings.set(`${request.method()} ${url}`, Date.now());
    const key = `${request.method()} ${url.split("?")[0]}`;
    requestCounts.set(key, (requestCounts.get(key) ?? 0) + 1);
  };

  const onResponse = (response: Response) => {
    const url = response.url();
    if (!url.includes("/api/")) return;
    if (url.includes("/api/health") || url.includes("/api/v1/health")) return;

    totalApiCalls += 1;
    const method = response.request().method();
    const status = response.status();
    const start = requestTimings.get(`${method} ${url}`);
    const latencyMs = start ? Date.now() - start : undefined;

    if (latencyMs !== undefined && latencyMs >= SLOW_THRESHOLD_MS) {
      slowRequests.push({ url, method, status, latencyMs });
    }

    if (status >= 400 && !shouldIgnore(status, url)) {
      issues.push({ url, method, status, latencyMs });
    }
  };

  page.on("request", onRequest);
  page.on("response", onResponse);

  return {
    drain(): NetworkMonitorReport {
      const duplicateKeys = [...requestCounts.entries()]
        .filter(([, count]) => count > 3)
        .map(([key, count]) => `${key} (×${count})`);

      return {
        issues: [...issues],
        slowRequests: [...slowRequests],
        duplicateKeys,
        totalApiCalls,
      };
    },
    detach() {
      page.off("request", onRequest);
      page.off("response", onResponse);
    },
  };
}

export function formatBackendReport(report: NetworkMonitorReport): string {
  const lines: string[] = [
    `# Backend Network Report`,
    `Total API calls: ${report.totalApiCalls}`,
    `Issues (4xx/5xx): ${report.issues.length}`,
    `Slow (≥${SLOW_THRESHOLD_MS}ms): ${report.slowRequests.length}`,
    `Duplicate bursts: ${report.duplicateKeys.length}`,
  ];
  for (const i of report.issues.slice(0, 20)) {
    lines.push(`- ${i.method} ${i.status} ${i.url}`);
  }
  return lines.join("\n");
}
