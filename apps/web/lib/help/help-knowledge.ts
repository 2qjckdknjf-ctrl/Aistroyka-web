import type { HelpRole } from "./help-catalog";

export type HelpLocale = "en" | "ru" | "es" | "it";

type LocalizedText = Record<HelpLocale, string>;

export type HelpKnowledgeEntry = {
  id: string;
  href: string;
  roles: Array<HelpRole | "all">;
  /** Keywords per locale for search ranking; English is always merged at query time as a fallback. */
  keywords: Record<HelpLocale, string[]>;
  title: LocalizedText;
  summary: LocalizedText;
  answer: LocalizedText;
};

/** Lowercase blob of locale keywords plus English (deduped) for token matching. */
export function keywordsMatchBlob(entry: HelpKnowledgeEntry, locale: HelpLocale): string {
  const primary = entry.keywords[locale] ?? [];
  const english = entry.keywords.en;
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const w of [...primary, ...english]) {
    const k = w.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      parts.push(w);
    }
  }
  return parts.join(" ").toLowerCase();
}

export const HELP_KNOWLEDGE_BASE: HelpKnowledgeEntry[] = [
  {
    id: "kb-getting-started",
    href: "/dashboard",
    roles: ["all"],
    keywords: {
      en: ["start", "first", "setup", "onboarding", "dashboard", "kpi", "queue", "home", "priority", "overview", "control", "center"],
      ru: ["старт", "начало", "первый", "настройка", "онбординг", "дашборд", "панель", "главная", "kpi", "очередь", "приоритет", "обзор", "операционн", "центр"],
      es: ["inicio", "empezar", "primero", "configuración", "panel", "kpi", "cola", "casa", "prioridad", "resumen", "centro", "control"],
      it: ["inizio", "partenza", "primo", "configurazione", "dashboard", "pannello", "home", "kpi", "coda", "priorità", "panoramica", "centro"],
    },
    title: {
      en: "Start with dashboard priorities",
      ru: "Начните с приоритетов главной панели",
      es: "Empieza por prioridades del panel",
      it: "Inizia dalle priorità della dashboard",
    },
    summary: {
      en: "Check KPI and queues first, then open action items.",
      ru: "Сначала проверьте KPI и очереди, затем переходите к задачам.",
      es: "Revisa KPI y colas, después abre elementos de acción.",
      it: "Controlla KPI e code, poi apri le azioni.",
    },
    answer: {
      en: "Open dashboard home, review queue cards and pending approvals, then drill down into items that are overdue or blocked.",
      ru: "Откройте главную страницу дашборда, проверьте карточки очередей и ожидающие согласования, затем разберите просроченные и заблокированные элементы.",
      es: "Abre la página principal del panel, revisa colas y aprobaciones pendientes, y después entra en elementos vencidos o bloqueados.",
      it: "Apri la home della dashboard, controlla code e approvazioni pendenti, poi entra negli elementi in ritardo o bloccati.",
    },
  },
  {
    id: "kb-project-setup",
    href: "/dashboard/projects",
    roles: ["manager", "admin", "owner"],
    keywords: {
      en: ["project", "milestone", "budget", "structure", "team", "roles", "scope", "setup", "plan"],
      ru: ["проект", "этап", "веха", "бюджет", "структура", "команда", "роли", "объём", "настройка", "план"],
      es: ["proyecto", "hito", "presupuesto", "estructura", "equipo", "roles", "alcance", "configuración", "plan"],
      it: ["progetto", "milestone", "budget", "struttura", "team", "ruoli", "perimetro", "setup", "piano"],
    },
    title: {
      en: "Set up project structure",
      ru: "Настройте структуру проекта",
      es: "Configura la estructura del proyecto",
      it: "Configura la struttura progetto",
    },
    summary: {
      en: "Milestones, budget and ownership define reliable project control.",
      ru: "Этапы, бюджет и владельцы дают устойчивый контроль проекта.",
      es: "Hitos, presupuesto y responsables mejoran el control del proyecto.",
      it: "Milestone, budget e responsabilità rendono il controllo affidabile.",
    },
    answer: {
      en: "Create milestones, set budget lines, assign internal roles, and keep change orders linked to the related project records.",
      ru: "Создайте этапы, задайте бюджетные линии, назначьте роли и связывайте change orders с соответствующими сущностями проекта.",
      es: "Crea hitos, define líneas de presupuesto, asigna roles internos y vincula change orders con los registros del proyecto.",
      it: "Crea milestone, definisci linee budget, assegna ruoli interni e collega i change order ai record progetto.",
    },
  },
  {
    id: "kb-daily-reporting",
    href: "/dashboard/daily-reports",
    roles: ["manager", "admin"],
    keywords: {
      en: ["report", "daily", "evidence", "photo", "approve", "submission", "field", "review"],
      ru: ["отчёт", "ежедневн", "доказательств", "фото", "согласован", "отправк", "полев", "проверк"],
      es: ["informe", "diario", "evidencia", "foto", "aprobar", "envío", "campo", "revisión"],
      it: ["report", "giornaliero", "evidenza", "foto", "approva", "invio", "cantiere", "revisione"],
    },
    title: {
      en: "Run daily reporting loop",
      ru: "Ведите ежедневный цикл отчётности",
      es: "Ejecuta el ciclo diario de reportes",
      it: "Gestisci il ciclo giornaliero report",
    },
    summary: {
      en: "Collect media evidence, review submissions, close approvals.",
      ru: "Собирайте медиа-доказательства, проверяйте отправки, закрывайте согласования.",
      es: "Recoge evidencia media, revisa envíos y cierra aprobaciones.",
      it: "Raccogli evidenze media, revisiona invii e chiudi approvazioni.",
    },
    answer: {
      en: "Use Daily Reports to verify field submissions with photos, then approve, reject, or request changes to complete the execution cycle.",
      ru: "Используйте Daily Reports для проверки полевых отправок с фото, затем согласуйте, отклоните или запросите правки для завершения цикла.",
      es: "Usa Daily Reports para validar envíos de campo con fotos; luego aprueba, rechaza o solicita cambios para cerrar el ciclo.",
      it: "Usa Daily Reports per verificare invii dal campo con foto; poi approva, rifiuta o richiedi modifiche per chiudere il ciclo.",
    },
  },
  {
    id: "kb-ai-risk",
    href: "/dashboard/ai",
    roles: ["all"],
    keywords: {
      en: ["ai", "risk", "intelligence", "alerts", "recommendation", "insight", "ml", "model"],
      ru: ["ии", "искусственн", "риск", "интеллект", "алерт", "рекомендац", "инсайт", "аналитик"],
      es: ["ia", "inteligencia", "riesgo", "alertas", "recomendación", "insight", "análisis"],
      it: ["ai", "ia", "rischio", "intelligence", "alert", "raccomandazione", "insight", "analisi"],
    },
    title: {
      en: "Use AI for risk control",
      ru: "Используйте ИИ для контроля рисков",
      es: "Usa IA para control de riesgos",
      it: "Usa AI per controllo rischi",
    },
    summary: {
      en: "Analyze alerts and convert AI recommendations into actions.",
      ru: "Анализируйте алерты и превращайте рекомендации ИИ в действия.",
      es: "Analiza alertas y convierte recomendaciones IA en acciones.",
      it: "Analizza alert e trasforma raccomandazioni AI in azioni.",
    },
    answer: {
      en: "Open AI and project Intelligence views, investigate top risks and evidence gaps, then assign follow-up tasks with owners and deadlines.",
      ru: "Откройте раздел ИИ и Intelligence проекта, проверьте ключевые риски и пробелы доказательств, затем назначьте задачи с владельцами и сроками.",
      es: "Abre AI e Intelligence del proyecto, revisa riesgos y gaps de evidencia, y asigna tareas de seguimiento con responsable y fecha.",
      it: "Apri AI e Intelligence progetto, verifica rischi e gap evidenze, poi assegna task di follow-up con owner e deadline.",
    },
  },
  {
    id: "kb-client-governance",
    href: "/dashboard/notifications",
    roles: ["manager", "admin", "client", "owner"],
    keywords: {
      en: ["client", "governance", "discussion", "request", "decision", "approval", "stakeholder", "audit"],
      ru: ["клиент", "управлен", "governance", "обсужден", "запрос", "решени", "согласован", "стейкхолдер", "аудит"],
      es: ["cliente", "gobernanza", "discusión", "solicitud", "decisión", "aprobación", "interesado", "auditoría"],
      it: ["cliente", "governance", "discussione", "richiesta", "decisione", "approvazione", "stakeholder", "audit"],
    },
    title: {
      en: "Manage client collaboration",
      ru: "Управляйте взаимодействием с клиентом",
      es: "Gestiona la colaboración con cliente",
      it: "Gestisci collaborazione cliente",
    },
    summary: {
      en: "Keep decisions structured with full traceability.",
      ru: "Ведите решения структурированно и с полной прослеживаемостью.",
      es: "Mantén decisiones estructuradas y trazables.",
      it: "Mantieni decisioni strutturate e tracciabili.",
    },
    answer: {
      en: "Use structured requests, discussions and change orders instead of chat-style updates to preserve governance and audit history.",
      ru: "Используйте структурированные запросы, discussions и change orders вместо чат-обновлений, чтобы сохранить governance и аудит.",
      es: "Usa solicitudes estructuradas, discussions y change orders en lugar de chat para mantener gobernanza e historial auditable.",
      it: "Usa richieste strutturate, discussioni e change order invece di aggiornamenti chat per mantenere governance e audit trail.",
    },
  },
];
