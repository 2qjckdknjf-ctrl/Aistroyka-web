import { NextResponse } from "next/server";
import { HELP_KNOWLEDGE_BASE, type HelpLocale } from "@/lib/help/help-knowledge";
import { LAUNCH_STEPS, type LaunchRole, type LaunchStepKey } from "@/lib/help/launch-steps";

type AssistantRequest = {
  query?: string;
  locale?: string;
  role?: string;
  pathname?: string;
  history?: string[];
  getStarted?: Partial<Record<LaunchStepKey, boolean>>;
  projectCount?: number;
  taskCount?: number;
  reportCount?: number;
  hasAiInsight?: boolean;
};

type AssistantAction = {
  id: string;
  title: string;
  reason: string;
  href: string;
  priority: "high" | "medium";
};

type AssistantRiskSignal = {
  id: string;
  title: string;
  detail: string;
  severity: "high" | "medium";
  href: string;
};

const KNOWN_LOCALES = new Set<HelpLocale>(["en", "ru", "es", "it"]);
const KNOWN_ROLES = new Set<LaunchRole>(["manager", "admin", "client", "owner"]);

const STEP_LABELS: Record<HelpLocale, Record<LaunchStepKey, string>> = {
  en: {
    createProject: "Create first project",
    inviteTeam: "Invite your team",
    addTask: "Create first task",
    uploadReport: "Submit first daily report",
    viewAi: "Open AI insights",
  },
  ru: {
    createProject: "Создать первый проект",
    inviteTeam: "Пригласить команду",
    addTask: "Создать первую задачу",
    uploadReport: "Отправить первый ежедневный отчёт",
    viewAi: "Открыть AI-инсайты",
  },
  es: {
    createProject: "Crear primer proyecto",
    inviteTeam: "Invitar a tu equipo",
    addTask: "Crear primera tarea",
    uploadReport: "Enviar primer informe diario",
    viewAi: "Abrir insights de IA",
  },
  it: {
    createProject: "Crea il primo progetto",
    inviteTeam: "Invita il team",
    addTask: "Crea la prima attività",
    uploadReport: "Invia il primo report giornaliero",
    viewAi: "Apri insight AI",
  },
};

const ROLE_ORDER: Record<LaunchRole, LaunchStepKey[]> = {
  manager: ["createProject", "addTask", "uploadReport", "inviteTeam", "viewAi"],
  admin: ["inviteTeam", "createProject", "addTask", "viewAi", "uploadReport"],
  client: ["viewAi", "uploadReport", "inviteTeam", "createProject", "addTask"],
  owner: ["viewAi", "createProject", "inviteTeam", "uploadReport", "addTask"],
};

const DEFAULT_SUMMARY: Record<HelpLocale, string> = {
  en: "Here is a focused plan for your current workflow.",
  ru: "Вот сфокусированный план для вашего текущего сценария работы.",
  es: "Aquí tienes un plan enfocado para tu flujo de trabajo actual.",
  it: "Ecco un piano mirato per il tuo flusso di lavoro attuale.",
};

const DEFAULT_ANSWER: Record<HelpLocale, string> = {
  en: "Start with high-risk blockers, then complete the next launch steps and validate evidence quality in reports.",
  ru: "Начните с блокеров высокого риска, затем закройте следующие шаги запуска и проверьте качество доказательств в отчётах.",
  es: "Empieza por bloqueos de alto riesgo, luego completa los siguientes pasos de arranque y valida la calidad de evidencias en informes.",
  it: "Inizia dai blocchi ad alto rischio, poi completa i prossimi passi di avvio e verifica la qualità delle evidenze nei report.",
};

const CONTEXT_HINTS: Record<HelpLocale, Record<string, string>> = {
  en: {
    projects: "You are in project workspace context.",
    reports: "You are in reporting and approvals context.",
    ai: "You are in AI intelligence context.",
    dashboard: "You are in control center context.",
  },
  ru: {
    projects: "Вы находитесь в контексте управления проектами.",
    reports: "Вы находитесь в контексте отчётности и согласований.",
    ai: "Вы находитесь в контексте AI intelligence.",
    dashboard: "Вы находитесь в контексте операционного центра.",
  },
  es: {
    projects: "Estás en contexto de gestión de proyectos.",
    reports: "Estás en contexto de reportes y aprobaciones.",
    ai: "Estás en contexto de inteligencia IA.",
    dashboard: "Estás en contexto de centro de control.",
  },
  it: {
    projects: "Sei nel contesto di gestione progetti.",
    reports: "Sei nel contesto di report e approvazioni.",
    ai: "Sei nel contesto di AI intelligence.",
    dashboard: "Sei nel contesto di centro di controllo.",
  },
};

function normalizeLocale(locale?: string): HelpLocale {
  return KNOWN_LOCALES.has(locale as HelpLocale) ? (locale as HelpLocale) : "en";
}

function normalizeRole(role?: string): LaunchRole {
  return KNOWN_ROLES.has(role as LaunchRole) ? (role as LaunchRole) : "manager";
}

function rankKnowledge(query: string, locale: HelpLocale, role: LaunchRole) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const words = normalized.split(/\s+/).filter(Boolean);

  return HELP_KNOWLEDGE_BASE.map((entry) => {
    const text = `${entry.title[locale]} ${entry.summary[locale]} ${entry.answer[locale]} ${entry.keywords.join(" ")}`.toLowerCase();
    const tokenScore = words.reduce((sum, word) => (text.includes(word) ? sum + 1 : sum), 0);
    const roleScore = entry.roles.includes("all") || entry.roles.includes(role) ? 2 : 0;
    return { entry, score: tokenScore * 2 + roleScore };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
}

function contextBoost(href: string, pathname?: string): number {
  if (!pathname) return 0;
  if (pathname.includes("/projects") && href.includes("/projects")) return 2;
  if ((pathname.includes("/reports") || pathname.includes("/daily-reports")) && href.includes("/daily-reports")) return 2;
  if (pathname.includes("/ai") && href.includes("/ai")) return 2;
  if (pathname === "/dashboard" && href === "/dashboard") return 2;
  return 0;
}

function buildLaunchActions(
  locale: HelpLocale,
  role: LaunchRole,
  getStarted?: Partial<Record<LaunchStepKey, boolean>>,
): AssistantAction[] {
  const pending = ROLE_ORDER[role].filter((step) => !getStarted?.[step]).slice(0, 2);
  return pending.map((step, index) => {
    const href = LAUNCH_STEPS.find((s) => s.key === step)?.href ?? "/dashboard/help";
    return {
      id: `launch-${step}`,
      title: STEP_LABELS[locale][step],
      reason: index === 0 ? DEFAULT_SUMMARY[locale] : DEFAULT_ANSWER[locale],
      href,
      priority: index === 0 ? "high" : "medium",
    };
  });
}

function buildRiskSignals(locale: HelpLocale, payload: AssistantRequest): AssistantRiskSignal[] {
  const signals: AssistantRiskSignal[] = [];
  const projectCount = payload.projectCount ?? 0;
  const taskCount = payload.taskCount ?? 0;
  const reportCount = payload.reportCount ?? 0;
  const hasAiInsight = Boolean(payload.hasAiInsight);

  if (projectCount === 0) {
    signals.push({
      id: "risk-no-project",
      title: STEP_LABELS[locale].createProject,
      detail: DEFAULT_SUMMARY[locale],
      severity: "high",
      href: "/dashboard/projects",
    });
  }
  if (taskCount > 0 && reportCount === 0) {
    signals.push({
      id: "risk-no-reports",
      title: STEP_LABELS[locale].uploadReport,
      detail: DEFAULT_ANSWER[locale],
      severity: "high",
      href: "/dashboard/daily-reports",
    });
  }
  if (!hasAiInsight && reportCount > 0) {
    signals.push({
      id: "risk-no-ai",
      title: STEP_LABELS[locale].viewAi,
      detail:
        locale === "ru"
          ? "ИИ-проверка ещё не встроена в текущий цикл принятия решений."
          : "AI checks are not yet embedded into the current decision loop.",
      severity: "medium",
      href: "/dashboard/ai",
    });
  }
  return signals.slice(0, 3);
}

function detectContextKey(pathname?: string): "projects" | "reports" | "ai" | "dashboard" {
  if (!pathname) return "dashboard";
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/reports") || pathname.includes("/daily-reports")) return "reports";
  if (pathname.includes("/ai")) return "ai";
  return "dashboard";
}

export async function POST(request: Request) {
  let payload: AssistantRequest;
  try {
    payload = (await request.json()) as AssistantRequest;
  } catch {
    return NextResponse.json({ summary: DEFAULT_SUMMARY.en, answer: DEFAULT_ANSWER.en, actions: [], followUps: [] });
  }

  const locale = normalizeLocale(payload.locale);
  const role = normalizeRole(payload.role);
  const query = (payload.query ?? "").trim();
  const ranked = rankKnowledge(query, locale, role);
  const top = ranked[0]?.entry;
  const contextKey = detectContextKey(payload.pathname);
  const history = (payload.history ?? []).map((item) => item.toLowerCase());

  const knowledgeActions: AssistantAction[] = ranked
    .map((row) => ({
      id: row.entry.id,
      title: row.entry.title[locale],
      reason: row.entry.summary[locale],
      href: row.entry.href,
      score:
        row.score +
        contextBoost(row.entry.href, payload.pathname) -
        (history.some((h) => h.includes(row.entry.title[locale].toLowerCase())) ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item, index) => ({
      id: item.id,
      title: item.title,
      reason: item.reason,
      href: item.href,
      priority: index === 0 ? "high" : "medium",
    }));

  const actions = [...knowledgeActions, ...buildLaunchActions(locale, role, payload.getStarted)].slice(0, 4);
  const riskSignals = buildRiskSignals(locale, payload);
  const followUps = ranked.slice(1, 4).map((row) => row.entry.title[locale]);
  const confidence = Math.min(98, 52 + actions.length * 8 + riskSignals.length * 6 + (top ? 10 : 0));

  return NextResponse.json({
    summary: `${CONTEXT_HINTS[locale][contextKey]} ${top?.summary[locale] ?? DEFAULT_SUMMARY[locale]}`,
    answer: top?.answer[locale] ?? DEFAULT_ANSWER[locale],
    actions,
    riskSignals,
    followUps,
    confidence,
    context: {
      role,
      pathname: payload.pathname ?? "/dashboard",
      area: contextKey,
    },
  });
}

