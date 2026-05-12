import { NextResponse } from "next/server";
import { HELP_KNOWLEDGE_BASE, type HelpLocale } from "@/lib/help/help-knowledge";
import type { LaunchRole, LaunchStepKey } from "@/lib/help/launch-steps";

type HintsRequest = {
  locale?: string;
  role?: string;
  getStarted?: Partial<Record<LaunchStepKey, boolean>>;
};

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

export async function POST(request: Request) {
  let payload: HintsRequest;
  try {
    payload = (await request.json()) as HintsRequest;
  } catch {
    return NextResponse.json({ hints: [] });
  }

  const locale: HelpLocale = KNOWN_LOCALES.has(payload.locale as HelpLocale)
    ? (payload.locale as HelpLocale)
    : "en";
  const role: LaunchRole = KNOWN_ROLES.has(payload.role as LaunchRole) ? (payload.role as LaunchRole) : "manager";
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

  return NextResponse.json({ hints });
}

