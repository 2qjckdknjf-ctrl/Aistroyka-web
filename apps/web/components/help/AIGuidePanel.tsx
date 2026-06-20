"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button, Card, Input } from "@/components/ui";
import { detectLaunchRole, type ActivationStatusResponse, type LaunchStepKey } from "@/lib/help/launch-steps";

type GuideAction = {
  id: string;
  title: string;
  reason: string;
  href: string;
  priority: "high" | "medium";
};

type GuideRiskSignal = {
  id: string;
  title: string;
  detail: string;
  severity: "high" | "medium";
  href: string;
};

type GuideResponse = {
  summary: string;
  answer: string;
  actions: GuideAction[];
  riskSignals: GuideRiskSignal[];
  followUps: string[];
  confidence: number;
};

type GuideHistoryItem = {
  query: string;
  summary: string;
};

type ActivationGuideStatus = ActivationStatusResponse & {
  projectCount?: number;
  taskCount?: number;
  reportCount?: number;
  hasAiInsight?: boolean;
};

type AssistantMetrics = {
  opens: number;
  asks: number;
  quickPrompts: number;
  actionClicks: number;
  engagementRate: number;
  completionRate: number;
};

const INITIAL_RESPONSE: GuideResponse = {
  summary: "",
  answer: "",
  actions: [],
  riskSignals: [],
  followUps: [],
  confidence: 0,
};

async function fetchActivationStatus(): Promise<ActivationGuideStatus> {
  const res = await fetch("/api/activation/status", { credentials: "include" });
  if (!res.ok) return {};
  return (await res.json()) as ActivationGuideStatus;
}

export function AIGuidePanel() {
  const t = useTranslations("helpCenter.aiGuide");
  const locale = useLocale();
  const pathname = usePathname();
  const role = detectLaunchRole(pathname);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<GuideResponse>(INITIAL_RESPONSE);
  const [activationStatus, setActivationStatus] = useState<ActivationGuideStatus>({});
  const [history, setHistory] = useState<GuideHistoryItem[]>([]);
  const [metrics, setMetrics] = useState<AssistantMetrics | null>(null);
  const storageKey = "aistroyka:ai-guide:history:v1";

  const quickPrompts = useMemo(() => [t("prompt1"), t("prompt2"), t("prompt3")], [t]);

  useEffect(() => {
    let active = true;
    async function loadActivationStatus() {
      const status = await fetchActivationStatus();
      if (active) setActivationStatus(status);
    }
    loadActivationStatus();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadMetrics() {
      try {
        const res = await fetch("/api/v1/help/assistant/metrics", { credentials: "include" });
        if (!res.ok) return;
        const json = (await res.json()) as { metrics?: AssistantMetrics };
        if (active) setMetrics(json.metrics ?? null);
      } catch {
        if (active) setMetrics(null);
      }
    }
    loadMetrics();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as GuideHistoryItem[];
      if (Array.isArray(parsed)) setHistory(parsed.slice(0, 4));
    } catch {
      // ignore storage read errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(history.slice(0, 4)));
    } catch {
      // ignore storage write errors
    }
  }, [history]);

  const sendEvent = useCallback(
    async (type: "open" | "ask" | "quick_prompt" | "action_click", payload?: Record<string, string>) => {
      try {
        await fetch("/api/v1/help/assistant/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            type,
            role,
            locale,
            pathname,
            payload: payload ?? {},
          }),
        });
      } catch {
        // ignore telemetry errors
      }
    },
    [locale, pathname, role],
  );

  const runGuide = useCallback(async (rawQuery: string, telemetry?: "open" | "ask" | "quick_prompt") => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/help/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: rawQuery,
          locale,
          role,
          pathname,
          history: history.map((item) => item.query),
          getStarted: activationStatus.getStarted as Partial<Record<LaunchStepKey, boolean>>,
          projectCount: activationStatus.projectCount,
          taskCount: activationStatus.taskCount,
          reportCount: activationStatus.reportCount,
          hasAiInsight: activationStatus.hasAiInsight,
        }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as GuideResponse;
      setHistory((prev) => [{ query: rawQuery || t("defaultQuery"), summary: json.summary }, ...prev].slice(0, 4));
      const kind = telemetry ?? (rawQuery.trim() ? "ask" : "open");
      if (kind === "quick_prompt") {
        void sendEvent("quick_prompt", { prompt: rawQuery });
      } else if (kind === "ask") {
        void sendEvent("ask", { query: rawQuery });
      } else {
        void sendEvent("open", { query: rawQuery || "default" });
      }
      setResponse(json);
    } finally {
      setLoading(false);
    }
  }, [activationStatus.getStarted, activationStatus.hasAiInsight, activationStatus.projectCount, activationStatus.reportCount, activationStatus.taskCount, history, locale, pathname, role, sendEvent, t]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void runGuide(query.trim());
  }

  useEffect(() => {
    if (!open) return;
    if (response.summary) return;
    void runGuide("");
  }, [open, response.summary, runGuide]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-30 rounded-full bg-aistroyka-accent px-4 py-3 text-aistroyka-subheadline font-semibold text-white shadow-lg hover:opacity-95"
        aria-expanded={open}
        aria-controls="ai-guide-panel"
      >
        {open ? t("close") : t("open")}
      </button>

      {open ? (
        <div id="ai-guide-panel">
          <Card className="fixed bottom-20 right-5 z-30 w-[min(92vw,28rem)] border-aistroyka-accent/30 p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{t("title")}</h3>
              <p className="mt-1 text-aistroyka-caption text-aistroyka-text-tertiary">{t("subtitle")}</p>
            </div>
            <span className="rounded-full bg-aistroyka-accent-light px-2 py-1 text-aistroyka-caption text-aistroyka-accent">
              {t(`roles.${role}`)}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("inputPlaceholder")}
              aria-label={t("inputLabel")}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary">
                {loading ? t("loading") : t("ask")}
              </Button>
              <Link href="/dashboard/help">
                <Button variant="secondary">{t("openHelpCenter")}</Button>
              </Link>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setQuery(prompt);
                  void runGuide(prompt, "quick_prompt");
                }}
                className="rounded-full border border-aistroyka-border-subtle px-2.5 py-1 text-aistroyka-caption text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised"
              >
                {prompt}
              </button>
            ))}
          </div>

          {response.summary ? (
            <div className="mt-4 space-y-3 border-t border-aistroyka-border-subtle pt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">{response.summary}</p>
                <span className="rounded-full bg-aistroyka-surface-raised px-2 py-1 text-aistroyka-caption text-aistroyka-text-tertiary">
                  {t("confidence", { value: response.confidence })}
                </span>
              </div>
              <p className="text-aistroyka-subheadline text-aistroyka-text-primary">{response.answer}</p>
            </div>
          ) : null}

          {response.riskSignals.length > 0 ? (
            <div className="mt-3 space-y-2">
              <p className="text-aistroyka-caption font-medium text-aistroyka-text-tertiary">{t("riskSignalsTitle")}</p>
              {response.riskSignals.map((signal) => (
                <div key={signal.id} className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{signal.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-aistroyka-caption ${
                        signal.severity === "high"
                          ? "bg-aistroyka-error/10 text-aistroyka-error"
                          : "bg-aistroyka-warning/10 text-aistroyka-warning"
                      }`}
                    >
                      {signal.severity === "high" ? t("priorityHigh") : t("priorityMedium")}
                    </span>
                  </div>
                  <p className="mt-1 text-aistroyka-caption text-aistroyka-text-tertiary">{signal.detail}</p>
                  <Link
                    href={signal.href}
                    onClick={() => void sendEvent("action_click", { signalId: signal.id, href: signal.href })}
                    className="mt-2 inline-flex text-aistroyka-caption text-aistroyka-accent hover:underline"
                  >
                    {t("doNow")}
                  </Link>
                </div>
              ))}
            </div>
          ) : null}

          {response.actions.length > 0 ? (
            <div className="mt-3 space-y-2">
              <p className="text-aistroyka-caption font-medium text-aistroyka-text-tertiary">{t("actionsTitle")}</p>
              {response.actions.map((action) => (
                <div key={action.id} className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-aistroyka-subheadline font-semibold text-aistroyka-text-primary">{action.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-aistroyka-caption ${
                        action.priority === "high"
                          ? "bg-aistroyka-error/10 text-aistroyka-error"
                          : "bg-aistroyka-surface-raised text-aistroyka-text-tertiary"
                      }`}
                    >
                      {action.priority === "high" ? t("priorityHigh") : t("priorityMedium")}
                    </span>
                  </div>
                  <p className="mt-1 text-aistroyka-caption text-aistroyka-text-tertiary">{action.reason}</p>
                  <Link
                    href={action.href}
                    onClick={() => void sendEvent("action_click", { actionId: action.id, href: action.href })}
                    className="mt-2 inline-flex text-aistroyka-caption text-aistroyka-accent hover:underline"
                  >
                    {t("doNow")}
                  </Link>
                </div>
              ))}
            </div>
          ) : null}

          {response.followUps.length > 0 ? (
            <div className="mt-3">
              <p className="text-aistroyka-caption font-medium text-aistroyka-text-tertiary">{t("followUpTitle")}</p>
              <ul className="mt-1 space-y-1 text-aistroyka-caption text-aistroyka-text-secondary">
                {response.followUps.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {history.length > 0 ? (
            <div className="mt-3 border-t border-aistroyka-border-subtle pt-3">
              <p className="text-aistroyka-caption font-medium text-aistroyka-text-tertiary">{t("recentTitle")}</p>
              <ul className="mt-1 space-y-1 text-aistroyka-caption text-aistroyka-text-secondary">
                {history.map((item, idx) => (
                  <li key={`${item.query}-${idx}`}>• {item.query}: {item.summary}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {metrics ? (
            <div className="mt-3 border-t border-aistroyka-border-subtle pt-3">
              <p className="text-aistroyka-caption font-medium text-aistroyka-text-tertiary">{t("metricsTitle")}</p>
              <div className="mt-1 grid grid-cols-2 gap-2 text-aistroyka-caption text-aistroyka-text-secondary">
                <p>{t("metricOpens", { value: metrics.opens })}</p>
                <p>{t("metricAsks", { value: metrics.asks })}</p>
                <p>{t("metricClicks", { value: metrics.actionClicks })}</p>
                <p>{t("metricCompletion", { value: metrics.completionRate })}</p>
              </div>
            </div>
          ) : null}
          </Card>
        </div>
      ) : null}
    </>
  );
}

