"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Lock } from "lucide-react";
import { buildPilotLeadPayload } from "../v41/v41-pilot-message";
import { postPublicContactLead } from "@/lib/public/post-public-contact-lead";
import { trackGrowthEvent } from "@/lib/growth/track-event";

const OBJECT_RANGE_KEYS = ["range1", "range2", "range3"] as const;
const ROLE_KEYS = ["rolePm", "roleOwner", "roleField", "roleOther"] as const;
const CHANNEL_KEYS = ["channelCall", "channelEmail", "channelMeet"] as const;

export function PilotForm() {
  const t = useTranslations("public.v43.contact");
  const tPilot = useTranslations("public.v41.pilot");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan")?.trim() || "";
  const [step, setStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [values, setValues] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    objectsRange: "",
    channel: "",
    goals: "",
  });

  const stepWidth = step === 1 ? "50%" : "100%";
  const fieldErrors = useMemo(() => {
    const errors: string[] = [];
    if (step >= 1) {
      if (!values.name.trim()) errors.push(t("name"));
      if (!values.email.trim()) errors.push(tPilot("email"));
      if (!values.company.trim()) errors.push(tPilot("company"));
    }
    if (step === 2) {
      if (!values.role) errors.push(t("role"));
      if (!values.objectsRange) errors.push(tPilot("objects"));
      if (!values.channel) errors.push(t("channel"));
      if (!values.goals.trim()) errors.push(t("goals"));
    }
    return errors;
  }, [step, t, tPilot, values]);

  function markStarted() {
    if (started) {
      return;
    }
    setStarted(true);
    void trackGrowthEvent("contact_lead.started", { page: window.location.pathname, locale });
  }

  function update(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit() {
    setStatus("sending");
    setErrorMessage(null);
    const payload = buildPilotLeadPayload({
      name: values.name,
      email: values.email,
      company: values.company,
      objectsRange: values.objectsRange,
      plan,
      role: values.role,
      channel: values.channel,
      goals: values.goals,
    });
    try {
      const result = await postPublicContactLead(payload, locale);
      if (!result.ok) {
        setStatus("error");
        setErrorMessage(result.error ?? tPilot("error"));
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(tPilot("error"));
    }
  }

  if (status === "success") {
    return (
      <div className="v43-form-card v41-glass" role="status">
        <p className="v41-eyebrow">{tPilot("successEyebrow")}</p>
        <h2>{tPilot("successTitle")}</h2>
        <p>{t("successNext")}</p>
      </div>
    );
  }

  return (
    <form
      className="v43-form-card v41-glass"
      onSubmit={(event) => {
        event.preventDefault();
        if (step === 1) {
          if (fieldErrors.length > 0) return;
          setStep(2);
          return;
        }
        if (fieldErrors.length > 0) return;
        void submit();
      }}
    >
      <p className="v41-eyebrow">{t("step", { current: step, total: 2 })}</p>
      <div className="v43-step-bar" aria-hidden>
        <span style={{ width: stepWidth }} />
      </div>
      {step === 1 ? (
        <div className="v43-form-grid">
          <label>
            {tPilot("name")}
            <input
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              onFocus={markStarted}
              required
              maxLength={200}
              placeholder={tPilot("namePlaceholder")}
            />
          </label>
          <label>
            {tPilot("email")}
            <input
              type="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              required
              placeholder={tPilot("emailPlaceholder")}
            />
          </label>
          <label>
            {tPilot("company")}
            <input
              value={values.company}
              onChange={(event) => update("company", event.target.value)}
              required
              maxLength={200}
              placeholder={tPilot("companyPlaceholder")}
            />
          </label>
        </div>
      ) : (
        <div className="v43-form-grid">
          <label>
            {t("role")}
            <select value={values.role} onChange={(event) => update("role", event.target.value)} required>
              <option value="">{t("rolePlaceholder")}</option>
              {ROLE_KEYS.map((key) => (
                <option key={key} value={t(key)}>
                  {t(key)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {tPilot("objects")}
            <select
              value={values.objectsRange}
              onChange={(event) => update("objectsRange", event.target.value)}
              required
            >
              <option value="">{tPilot("objectsPlaceholder")}</option>
              {OBJECT_RANGE_KEYS.map((key) => (
                <option key={key} value={tPilot(key)}>
                  {tPilot(key)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("channel")}
            <select value={values.channel} onChange={(event) => update("channel", event.target.value)} required>
              <option value="">{t("channelPlaceholder")}</option>
              {CHANNEL_KEYS.map((key) => (
                <option key={key} value={t(key)}>
                  {t(key)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("goals")}
            <textarea
              value={values.goals}
              onChange={(event) => update("goals", event.target.value)}
              required
              maxLength={5000}
              placeholder={t("goalsPlaceholder")}
            />
          </label>
        </div>
      )}
      {status === "error" && errorMessage ? (
        <p className="v41-form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <div className="v41-hero-actions">
        {step === 2 ? (
          <button type="button" className="v41-btn v41-btn-secondary" onClick={() => setStep(1)}>
            {t("back")}
          </button>
        ) : null}
        <button className="v41-btn v41-btn-primary" type="submit" disabled={status === "sending"}>
          {step === 1 ? t("continue") : status === "sending" ? tPilot("sending") : t("submit")} <ArrowRight size={18} />
        </button>
      </div>
      <p className="v41-privacy-note">
        <Lock size={15} /> {tPilot("privacy")}
      </p>
    </form>
  );
}
