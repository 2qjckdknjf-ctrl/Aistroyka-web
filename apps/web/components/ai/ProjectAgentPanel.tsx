"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui";

interface AgentApiResponse {
  runId?: string;
  answer?: string;
  health?: { score?: number; band?: string };
  risks?: Array<{ title: string; why?: string }>;
  blockers?: Array<{ title: string; why?: string }>;
  evidence?: Array<{ evidenceId: string; type: string }>;
  proposedActions?: Array<{ actionType: string; reason: string }>;
  limitations?: string[];
  confidence?: string;
  error?: string;
  code?: string;
}

export function ProjectAgentPanel({ projectId }: { projectId: string }) {
  const t = useTranslations("dashboardDetail");
  const locale = useLocale();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AgentApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prompts = [
    { id: "attention", text: t("agentQuickPromptAttention") },
    { id: "overdue", text: t("agentQuickPromptOverdue") },
    { id: "critical", text: t("agentQuickPromptCritical") },
    { id: "deadlines", text: t("agentQuickPromptDeadlines") },
    { id: "last7", text: t("agentQuickPromptLast7Days") },
  ];

  const ask = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q) return;
      setPending(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch(`/api/v1/projects/${projectId}/agent`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-idempotency-key": crypto.randomUUID(),
            "x-locale": locale,
          },
          body: JSON.stringify({ message: q }),
        });
        const body = (await res.json()) as AgentApiResponse;
        if (!res.ok) {
          if (body.code === "AGENT_FEATURE_DISABLED") {
            setError(t("agentFeatureDisabled"));
          } else {
            setError(body.error ?? t("agentAskFailed"));
          }
          return;
        }
        setResult(body);
      } catch {
        setError(t("agentAskFailed"));
      } finally {
        setPending(false);
      }
    },
    [projectId, t, locale]
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-aistroyka-text-secondary">{t("askAiAboutProject")}</p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => {
              setMessage(p.text);
              void ask(p.text);
            }}
          >
            {p.text}
          </Button>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-3 py-2 text-sm text-aistroyka-text-primary"
        aria-label={t("askAiAboutProject")}
      />
      <Button type="button" onClick={() => void ask(message)} disabled={pending || !message.trim()} loading={pending}>
        {t("agentAsk")}
      </Button>
      {error && <p className="text-sm text-aistroyka-danger">{error}</p>}
      {result && (
        <div className="space-y-2 rounded border border-aistroyka-border-subtle p-3 text-sm">
          {result.health?.band && (
            <p>
              {t("agentHealth")}: {result.health.band}
              {result.health.score != null ? ` (${result.health.score})` : ""}
            </p>
          )}
          {result.answer && <p>{result.answer}</p>}
          {result.blockers && result.blockers.length > 0 && (
            <div>
              <p className="font-medium">{t("agentBlockers")}</p>
              <ul className="list-disc pl-5">
                {result.blockers.map((b) => (
                  <li key={b.title}>{b.title}</li>
                ))}
              </ul>
            </div>
          )}
          {result.risks && result.risks.length > 0 && (
            <div>
              <p className="font-medium">{t("agentRisks")}</p>
              <ul className="list-disc pl-5">
                {result.risks.map((r) => (
                  <li key={r.title}>{r.title}</li>
                ))}
              </ul>
            </div>
          )}
          {result.proposedActions && result.proposedActions.length > 0 && (
            <div>
              <p className="font-medium">{t("agentSuggestedActions")}</p>
              <ul className="list-disc pl-5">
                {result.proposedActions.map((a) => (
                  <li key={a.actionType}>{a.reason || a.actionType}</li>
                ))}
              </ul>
            </div>
          )}
          {result.limitations && result.limitations.length > 0 && (
            <p className="text-aistroyka-text-tertiary">
              {t("agentLimitations")}: {result.limitations.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
