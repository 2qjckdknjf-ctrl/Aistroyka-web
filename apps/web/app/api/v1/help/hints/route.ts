import { NextResponse } from "next/server";
import { HELP_KNOWLEDGE_BASE, type HelpLocale } from "@/lib/help/help-knowledge";
import type { LaunchRole, LaunchStepKey } from "@/lib/help/launch-steps";
import {
  abortHelpLiteIdempotency,
  clampString,
  commitHelpLiteIdempotency,
  enforceHelpAbuseGuards,
  HELP_MAX_ROLE_LEN,
  readJsonBodyBounded,
  requireHelpTenant,
} from "@/lib/help/help-api.shared";

type HintsRequest = {
  locale?: string;
  role?: string;
  getStarted?: Partial<Record<LaunchStepKey, boolean>>;
};

const ROUTE_KEY = "POST /api/v1/help/hints";
const ENDPOINT = "/api/v1/help/hints";

const KNOWN_LOCALES = new Set<HelpLocale>(["en", "ru", "es", "it"]);
const KNOWN_ROLES = new Set<LaunchRole>(["manager", "admin", "client", "owner"]);

const STEP_TO_ARTICLE: Record<LaunchStepKey, string> = {
  createProject: "kb-project-setup",
  inviteTeam: "kb-project-setup",
  addTask: "kb-daily-reporting",
  uploadReport: "kb-daily-reporting",
  viewAi: "kb-ai-risk",
};

const ROLE_HINT_ORDER: Record<LaunchRole, LaunchStepKey[]> = {
  manager: ["createProject", "addTask", "uploadReport", "viewAi", "inviteTeam"],
  admin: ["inviteTeam", "createProject", "viewAi", "addTask", "uploadReport"],
  client: ["viewAi", "uploadReport", "inviteTeam", "createProject", "addTask"],
  owner: ["viewAi", "createProject", "inviteTeam", "uploadReport", "addTask"],
};

/** Body role is a UX hint only — not authorization. */
function normalizeRoleHint(role?: string | null): LaunchRole {
  return KNOWN_ROLES.has(role as LaunchRole) ? (role as LaunchRole) : "manager";
}

function parseHintsBody(
  value: unknown
): { ok: true; payload: HintsRequest } | { ok: false; response: NextResponse } {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid body", code: "invalid_json" }, { status: 400 }),
    };
  }
  const raw = value as Record<string, unknown>;
  const role = clampString(raw.role, HELP_MAX_ROLE_LEN) ?? undefined;
  const locale = clampString(raw.locale, 16) ?? undefined;
  return {
    ok: true,
    payload: {
      locale,
      role,
      getStarted:
        raw.getStarted && typeof raw.getStarted === "object" && !Array.isArray(raw.getStarted)
          ? (raw.getStarted as Partial<Record<LaunchStepKey, boolean>>)
          : undefined,
    },
  };
}

export async function POST(request: Request) {
  const auth = await requireHelpTenant(request);
  if (!auth.ok) return auth.response;

  const guards = await enforceHelpAbuseGuards(request, auth.ctx, ENDPOINT, ROUTE_KEY);
  if (guards) return guards;

  const body = await readJsonBodyBounded(request);
  if (!body.ok) {
    const abort = await abortHelpLiteIdempotency(request);
    return abort ?? body.response;
  }

  const parsed = parseHintsBody(body.value);
  if (!parsed.ok) {
    const abort = await abortHelpLiteIdempotency(request);
    return abort ?? parsed.response;
  }

  const payload = parsed.payload;
  const locale: HelpLocale = KNOWN_LOCALES.has(payload.locale as HelpLocale)
    ? (payload.locale as HelpLocale)
    : "en";
  const role = normalizeRoleHint(payload.role);
  const getStarted = payload.getStarted ?? {};

  const hints = ROLE_HINT_ORDER[role]
    .filter((step) => !getStarted[step])
    .slice(0, 3)
    .map((step) => {
      const articleId = STEP_TO_ARTICLE[step];
      const article = HELP_KNOWLEDGE_BASE.find((entry) => entry.id === articleId);
      return {
        step,
        title: article?.title[locale] ?? "Guidance",
        reason: article?.summary[locale] ?? "",
        action: article?.answer[locale] ?? "",
        href: article?.href ?? "/dashboard/help",
      };
    });

  const responseBody = { hints };
  const finalizeFail = await commitHelpLiteIdempotency(request, auth.ctx, ROUTE_KEY, responseBody, 200);
  if (finalizeFail) return finalizeFail;
  return NextResponse.json(responseBody);
}
