"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle, Lock, X } from "lucide-react";
import { getFocusableElements, getNextFocusIndex } from "@/components/ui/modal-focus";
import { buildPilotLeadPayload } from "./v41-pilot-message";

const OBJECT_RANGE_KEYS = ["range1", "range2", "range3"] as const;

type PilotModalProps = {
  onClose: () => void;
};

export function PilotModal({ onClose }: PilotModalProps) {
  const t = useTranslations("public.v41.pilot");
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusables = panel ? getFocusableElements(panel) : [];
    focusables[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = getFocusableElements(panelRef.current);
      if (nodes.length === 0) return;
      const current = nodes.findIndex((el) => el === document.activeElement);
      const next = getNextFocusIndex(current, nodes.length, event.shiftKey);
      if (next >= 0) {
        event.preventDefault();
        nodes[next]?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = buildPilotLeadPayload({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      company: String(data.get("company") ?? ""),
      objectsRange: String(data.get("objectsRange") ?? ""),
    });
    setStatus("sending");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(typeof json.error === "string" ? json.error : t("error"));
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(t("error"));
    }
  }

  return (
    <div className="v41-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={panelRef}
        className="v41-pilot-modal v41-glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="v41-icon-button v41-close-button" aria-label={t("close")} onClick={onClose}>
          <X size={20} />
        </button>
        {status === "success" ? (
          <div className="v41-success-state">
            <CheckCircle size={52} />
            <p className="v41-eyebrow">{t("successEyebrow")}</p>
            <h2 id={titleId}>{t("successTitle")}</h2>
            <p>{t("successBody")}</p>
            <button type="button" className="v41-btn v41-btn-primary" onClick={onClose}>
              {t("done")}
            </button>
          </div>
        ) : (
          <>
            <p className="v41-eyebrow">{t("eyebrow")}</p>
            <h2 id={titleId}>{t("title")}</h2>
            <p className="v41-modal-copy">{t("copy")}</p>
            <form onSubmit={handleSubmit}>
              <label>
                {t("name")}
                <input name="name" required maxLength={200} placeholder={t("namePlaceholder")} disabled={status === "sending"} />
              </label>
              <label>
                {t("email")}
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={t("emailPlaceholder")}
                  disabled={status === "sending"}
                />
              </label>
              <label className="v41-span-2">
                {t("company")}
                <input
                  name="company"
                  required
                  maxLength={200}
                  placeholder={t("companyPlaceholder")}
                  disabled={status === "sending"}
                />
              </label>
              <label className="v41-span-2">
                {t("objects")}
                <select name="objectsRange" required defaultValue="" disabled={status === "sending"}>
                  <option value="" disabled>
                    {t("objectsPlaceholder")}
                  </option>
                  {OBJECT_RANGE_KEYS.map((key) => (
                    <option key={key} value={t(key)}>
                      {t(key)}
                    </option>
                  ))}
                </select>
              </label>
              {status === "error" && errorMessage ? (
                <p className="v41-form-error" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <button
                className="v41-btn v41-btn-primary v41-btn-full v41-span-2"
                type="submit"
                disabled={status === "sending"}
              >
                {status === "sending" ? t("sending") : t("submit")} <ArrowRight size={18} />
              </button>
            </form>
            <p className="v41-privacy-note">
              <Lock size={15} /> {t("privacy")}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
