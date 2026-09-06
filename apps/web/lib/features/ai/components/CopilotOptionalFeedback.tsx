"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { submitAiFeedback } from "../api/submitAiFeedback";
import { buildPreferencePairFields, textOutput } from "../api/buildPreferencePairFields";

export interface CopilotOptionalFeedbackProps {
  runId: string | null | undefined;
  assistantText: string;
  userQuestion?: string | null;
  getAuthToken: () => Promise<string | null>;
}

/**
 * Optional manager feedback on copilot output — collapsed section only.
 * No required user action; preference fields sent only when correction provided.
 */
export function CopilotOptionalFeedback({
  runId,
  assistantText,
  userQuestion,
  getAuthToken,
}: CopilotOptionalFeedbackProps) {
  const tDetail = useTranslations("dashboardDetail");
  const [correction, setCorrection] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!runId?.trim()) return null;

  const submit = async () => {
    setStatus("saving");
    setError(null);
    const pairFields =
      correction.trim().length > 0
        ? buildPreferencePairFields({
            aiRequestId: runId,
            taskType: "copilot",
            audience: "internal",
            inputContext: userQuestion ? { question: userQuestion } : {},
            originalOutput: textOutput(assistantText),
            chosenOutput: textOutput(correction.trim()),
          })
        : null;

    const result = await submitAiFeedback(
      {
        runId: runId.trim(),
        sourceKind: "human",
        feedbackCategory: "usefulness",
        reviewerRole: "manager",
        usefulnessScore: correction.trim() ? 2 : 4,
        comments: correction.trim() || undefined,
        ...(pairFields ?? {}),
      },
      { getAuthToken }
    );

    if (!result.ok) {
      setStatus("error");
      setError(result.error ?? tDetail("failed"));
      return;
    }
    setStatus("saved");
  };

  return (
    <div className="mt-3 space-y-2 border-t border-aistroyka-border-subtle pt-3">
      <p className="text-xs text-aistroyka-text-tertiary">{tDetail("copilotOptionalFeedbackHint")}</p>
      <textarea
        value={correction}
        onChange={(e) => {
          setCorrection(e.target.value);
          setStatus("idle");
        }}
        rows={2}
        placeholder={tDetail("copilotCorrectionOptional")}
        className="w-full rounded border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1 text-xs"
      />
      <Button type="button" size="sm" disabled={status === "saving"} onClick={() => void submit()}>
        {status === "saving" ? tDetail("running") : tDetail("submitFeedback")}
      </Button>
      {status === "saved" ? (
        <p className="text-xs text-aistroyka-accent">{tDetail("copilotFeedbackSaved")}</p>
      ) : null}
      {status === "error" && error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
