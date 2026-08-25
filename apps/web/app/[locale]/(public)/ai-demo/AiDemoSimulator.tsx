"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";

const MOCK_RESULTS = {
  detectedElements: ["foundation", "walls", "framing", "roofStructure", "mepRoughIn"] as const,
  progressAnalysis: "mockProgressAnalysis",
  riskDetection: "mockRiskDetection",
  delayPrediction: "mockDelayPrediction",
  aiSummary: "mockAiSummary",
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
    <div className="v43-plan-card v41-glass">
      <div className="v43-two-col">
        <div>
          <h3>{t("uploadPhoto")}</h3>
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
            className="v41-btn v41-btn-secondary mt-3 flex min-h-[200px] w-full flex-col items-center justify-center"
          >
            {previewUrl && step !== "upload" ? (
              <img src={previewUrl} alt={t("previewAlt")} />
            ) : (
              <span>{step === "analyzing" ? t("analyzing") : t("clickOrDropPhoto")}</span>
            )}
          </button>
          <p>{t("demoUsesMockOutput")}</p>
        </div>
        <div>
          {step === "results" ? (
            <>
              <div>
                <h4>{t("detectedElements")}</h4>
                <ul>
                  {MOCK_RESULTS.detectedElements.map((el) => (
                    <li key={el}>{t(el)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>{t("progressAnalysis")}</h4>
                <p>{t(MOCK_RESULTS.progressAnalysis)}</p>
              </div>
              <div>
                <h4>{t("riskDetection")}</h4>
                <p>{t(MOCK_RESULTS.riskDetection)}</p>
              </div>
              <div>
                <h4>{t("delayPrediction")}</h4>
                <p>{t(MOCK_RESULTS.delayPrediction)}</p>
              </div>
              <div>
                <h4>{t("aiSummary")}</h4>
                <p>{t(MOCK_RESULTS.aiSummary)}</p>
              </div>
              <button type="button" onClick={handleTryDemo} className="v41-btn v41-btn-secondary">
                {t("tryAnotherPhoto")}
              </button>
            </>
          ) : null}
          {step === "upload" ? <p>{t("uploadPhotoHint")}</p> : null}
          {step === "analyzing" ? <p>{t("runningAnalysis")}</p> : null}
        </div>
      </div>
    </div>
  );
}
