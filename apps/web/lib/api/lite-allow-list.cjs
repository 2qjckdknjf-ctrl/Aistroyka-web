/**
 * CJS twin of lite-allow-list for OpenNext Cloudflare worker patch.
 * Keep path rules in sync with lite-allow-list.ts.
 */

const FIELD_WORKER_CLIENTS = new Set([
  "ios_lite",
  "android_lite",
  "ios_worker",
  "android_worker",
]);

function isSamePathOrChild(pathname, prefix) {
  if (pathname === prefix) return true;
  return pathname.startsWith(`${prefix}/`);
}

function isLiteClient(header) {
  const v = typeof header === "string" ? header.toLowerCase().trim() : "";
  return FIELD_WORKER_CLIENTS.has(v);
}

function isLegacyProjectsOrAiPath(pathname) {
  return isSamePathOrChild(pathname, "/api/projects") || isSamePathOrChild(pathname, "/api/ai");
}

function isPathAllowed(pathname, method) {
  const m = (method || "GET").toUpperCase();
  if (m === "GET" && /^\/api\/v1\/tasks\/[^/]+$/.test(pathname)) return true;
  if (m === "GET" && /^\/api\/v1\/reports\/[^/]+$/.test(pathname)) return true;
  if (pathname === "/api/v1/projects" && method === "GET") return true;
  if (pathname === "/api/v1/me" && m === "GET") return true;
  if (pathname === "/api/v1/config") return true;
  if (isSamePathOrChild(pathname, "/api/v1/worker")) return true;
  if (isSamePathOrChild(pathname, "/api/v1/sync")) return true;
  if (/^\/api\/v1\/media\/upload-sessions\/?$/.test(pathname) && m !== "POST") return false;
  if (isSamePathOrChild(pathname, "/api/v1/media/upload-sessions")) return true;
  if (/^\/api\/v1\/devices\/?$/.test(pathname)) return false;
  if (isSamePathOrChild(pathname, "/api/v1/devices")) return true;
  if (isSamePathOrChild(pathname, "/api/v1/auth")) return true;
  if (m === "GET" && /^\/api\/v1\/reports\/[^/]+\/analysis-status$/.test(pathname)) return true;
  if (pathname === "/api/v1/activation/status" && m === "GET") return true;
  if (pathname === "/api/v1/help/hints" && m === "POST") return true;
  if (pathname === "/api/v1/help/assistant" && m === "POST") return true;
  if (pathname === "/api/v1/help/assistant/events" && m === "POST") return true;
  return false;
}

function checkLiteAllowList(pathname, method, xClient) {
  if (!isLiteClient(xClient)) return null;
  const m = (method || "GET").toUpperCase();
  if (isLegacyProjectsOrAiPath(pathname)) {
    return { status: 403, body: { error: "forbidden", code: "lite_client_path_forbidden" } };
  }
  if (isSamePathOrChild(pathname, "/api/v1") && !isPathAllowed(pathname, m)) {
    return { status: 403, body: { error: "forbidden", code: "lite_client_path_forbidden" } };
  }
  return null;
}

/**
 * Inline JS snippet for OpenNext worker bypass: deny field-worker disallowed paths
 * before skipping Next middleware.
 */
function buildLiteBypassGuardExpression() {
  return `(function () {
                const xClient = (request.headers.get("x-client") || "").toLowerCase().trim();
                const isFieldWorker = xClient === "ios_lite" || xClient === "android_lite" || xClient === "ios_worker" || xClient === "android_worker";
                if (!isFieldWorker) return null;
                const pathname = url.pathname;
                const method = (request.method || "GET").toUpperCase();
                const isChild = (p, prefix) => p === prefix || p.startsWith(prefix + "/");
                const legacy = isChild(pathname, "/api/projects") || isChild(pathname, "/api/ai");
                let allowed = false;
                if (method === "GET" && /^\\/api\\/v1\\/tasks\\/[^/]+$/.test(pathname)) allowed = true;
                else if (method === "GET" && /^\\/api\\/v1\\/reports\\/[^/]+$/.test(pathname)) allowed = true;
                else if (pathname === "/api/v1/projects" && request.method === "GET") allowed = true;
                else if (pathname === "/api/v1/me" && method === "GET") allowed = true;
                else if (pathname === "/api/v1/config") allowed = true;
                else if (isChild(pathname, "/api/v1/worker")) allowed = true;
                else if (isChild(pathname, "/api/v1/sync")) allowed = true;
                else if (/^\\/api\\/v1\\/media\\/upload-sessions\\/?$/.test(pathname) && method !== "POST") allowed = false;
                else if (isChild(pathname, "/api/v1/media/upload-sessions")) allowed = true;
                else if (/^\\/api\\/v1\\/devices\\/?$/.test(pathname)) allowed = false;
                else if (isChild(pathname, "/api/v1/devices")) allowed = true;
                else if (isChild(pathname, "/api/v1/auth")) allowed = true;
                else if (method === "GET" && /^\\/api\\/v1\\/reports\\/[^/]+\\/analysis-status$/.test(pathname)) allowed = true;
                else if (pathname === "/api/v1/activation/status" && method === "GET") allowed = true;
                else if (pathname === "/api/v1/help/hints" && method === "POST") allowed = true;
                else if (pathname === "/api/v1/help/assistant" && method === "POST") allowed = true;
                else if (pathname === "/api/v1/help/assistant/events" && method === "POST") allowed = true;
                const denied = legacy || (isChild(pathname, "/api/v1") && !allowed);
                if (!denied) return null;
                return new Response(JSON.stringify({ error: "forbidden", code: "lite_client_path_forbidden" }), {
                    status: 403,
                    headers: { "content-type": "application/json" },
                });
            })()`;
}

module.exports = {
  checkLiteAllowList,
  isLiteClient,
  isPathAllowed,
  isLegacyProjectsOrAiPath,
  buildLiteBypassGuardExpression,
};
