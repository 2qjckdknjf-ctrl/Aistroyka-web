"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";

const MOCK_RESULTS = {
  detectedElements: ["Foundation", "Walls", "Framing", "Roof structure", "MEP rough-in"],
  progressAnalysis: "Estimated completion: 67%. On track vs baseline.",
  riskDetection: "2 medium: weather delay possible; 1 low: material lead time.",
  delayPrediction: "Estimated delay: 0–3 days if current pace holds.",
  aiSummary: "Site progress is consistent with schedule. Recommend reinforcing waterproofing checks before next phase.",
};

export function AiDemoSimulator() {
  const t = useTranslations("public.aiDemo");
  const [step, setStep] = useState<"upload" | "analyzing" | "results">("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setStep("analyzing");
    setTimeout(() => setStep("results"), 1500);
  }

  function handleTryDemo() {
    if (step === "results") {
      setStep("upload");
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    inputRef.current?.click();
  }

  return (
    <div className="rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6 shadow-[var(--aistroyka-shadow-e2)]">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-[var(--aistroyka-font-headline)] font-semibold text-[var(--aistroyka-text-primary)]">
            {t("uploadPhoto")}
          </h3>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-hidden
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={handleTryDemo}
            disabled={step === "analyzing"}
            className="mt-3 flex min-h-[200px] w-full flex-col items-center justify-center rounded-[var(--aistroyka-radius-lg)] border-2 border-dashed border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-bg-primary)] transition-colors hover:border-[var(--aistroyka-accent)] hover:bg-[var(--aistroyka-accent-light)]/30 disabled:opacity-70"
          >
            {previewUrl && step !== "upload" ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-[200px] w-full object-contain object-center"
              />
            ) : (
              <span className="text-[var(--aistroyka-text-secondary)]">
                {step === "analyzing" ? "Analyzing…" : "Click or drop a photo"}
              </span>
            )}
          </button>
          <p className="mt-2 text-[var(--aistroyka-font-caption)] text-[var(--aistroyka-text-tertiary)]">
            Demo uses mock AI output. No data is sent to the server.
          </p>
        </div>
        <div className="space-y-4">
          {step === "results" && (
            <>
              <div>
                <h4 className="text-[var(--aistroyka-font-footnote)] font-semibold text-[var(--aistroyka-text-secondary)]">
                  {t("detectedElements")}
                </h4>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {MOCK_RESULTS.detectedElements.map((el) => (
                    <li
                      key={el}
                      className="rounded-[var(--aistroyka-radius-sm)] bg-[var(--aistroyka-accent-light)] px-2 py-1 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-accent)]"
                    >
                      {el}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[var(--aistroyka-font-footnote)] font-semibold text-[var(--aistroyka-text-secondary)]">
                  {t("progressAnalysis")}
                </h4>
                <p className="mt-1 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
                  {MOCK_RESULTS.progressAnalysis}
                </p>
              </div>
              <div>
                <h4 className="text-[var(--aistroyka-font-footnote)] font-semibold text-[var(--aistroyka-text-secondary)]">
                  {t("riskDetection")}
                </h4>
                <p className="mt-1 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
                  {MOCK_RESULTS.riskDetection}
                </p>
              </div>
              <div>
                <h4 className="text-[var(--aistroyka-font-footnote)] font-semibold text-[var(--aistroyka-text-secondary)]">
                  {t("delayPrediction")}
                </h4>
                <p className="mt-1 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
                  {MOCK_RESULTS.delayPrediction}
                </p>
              </div>
              <div>
                <h4 className="text-[var(--aistroyka-font-footnote)] font-semibold text-[var(--aistroyka-text-secondary)]">
                  {t("aiSummary")}
                </h4>
                <p className="mt-1 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
                  {MOCK_RESULTS.aiSummary}
                </p>
              </div>
              <button type="button" onClick={handleTryDemo} className="btn-secondary mt-2 text-sm">
                Try another photo
              </button>
            </>
          )}
          {step === "upload" && (
            <p className="text-[var(--aistroyka-text-secondary)]">
              Upload a construction site photo to see mock AI analysis results.
            </p>
          )}
          {step === "analyzing" && (
            <p className="text-[var(--aistroyka-text-secondary)]">Running analysis…</p>
          )}
        </div>
      </div>
    </div>
  );
}
