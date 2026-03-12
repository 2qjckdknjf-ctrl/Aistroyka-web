"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input, Button } from "@/components/ui";
import { Textarea } from "@/components/ui";

export function ContactForm() {
  const t = useTranslations("public.form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company: company || undefined, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || t("error"));
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setCompany("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMessage(t("error"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="contact-name"
        label={t("name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={200}
        disabled={status === "sending"}
      />
      <Input
        id="contact-email"
        type="email"
        label={t("email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === "sending"}
      />
      <Input
        id="contact-company"
        label={t("company")}
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        maxLength={200}
        disabled={status === "sending"}
      />
      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-[var(--aistroyka-text-primary)]"
        >
          {t("message")}
        </label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={5000}
          rows={5}
          disabled={status === "sending"}
          className="min-h-[120px] w-full rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] px-4 py-3 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)] placeholder-[var(--aistroyka-text-tertiary)] focus:border-[var(--aistroyka-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--aistroyka-accent)]/20 disabled:opacity-50"
        />
      </div>
      {status === "success" && (
        <p className="text-[var(--aistroyka-font-subheadline)] text-[var(--aistroyka-success)]" role="status">
          {t("success")}
        </p>
      )}
      {status === "error" && errorMessage && (
        <p className="text-[var(--aistroyka-font-subheadline)] text-[var(--aistroyka-error)]" role="alert">
          {errorMessage}
        </p>
      )}
      <Button type="submit" loading={status === "sending"} disabled={status === "sending"}>
        {status === "sending" ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
