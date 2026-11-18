"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { hasSupabaseEnv } from "@/lib/env";
import { Input, Button, Alert } from "@/components/ui";

const FORGOT_PASSWORD_ENDPOINT = "/api/v1/auth/forgot-password";

function ForgotPasswordForm() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [envOk, setEnvOk] = useState<boolean | null>(null);

  useEffect(() => {
    setEnvOk(hasSupabaseEnv());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(FORGOT_PASSWORD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? t("defaultError"));
        return;
      }
      setMessage(t("resetEmailSent"));
    } catch {
      setError(t("defaultError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] min-h-screen items-center justify-center bg-aistroyka-bg-primary px-aistroyka-4 py-aistroyka-8 sm:py-aistroyka-12">
      <div className="w-full max-w-[400px]">
        <div className="card-elevated">
          <div className="mb-aistroyka-4 flex justify-center">
            <Image src="/brand/aistroyka-logo.png" alt={t("tagline")} width={140} height={48} className="h-12 w-auto object-contain" unoptimized />
          </div>
          <div className="mb-aistroyka-6 text-center sm:mb-aistroyka-8">
            <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">{t("forgotPasswordTitle")}</h1>
            <p className="mt-aistroyka-1 text-aistroyka-subheadline text-aistroyka-text-secondary">{t("forgotPasswordHint")}</p>
          </div>
          {envOk === false && (
            <Alert
              message="Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
              style="error"
              className="mb-aistroyka-4"
            />
          )}
          {message ? <Alert message={message} style="success" className="mb-aistroyka-4" /> : null}
          <form onSubmit={handleSubmit} className="space-y-aistroyka-5">
            <Input
              id="email"
              type="email"
              name="email"
              label={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              required
              disabled={Boolean(message)}
            />
            {error ? <Alert message={error} style="error" /> : null}
            {!message ? (
              <Button type="submit" loading={loading} disabled={loading || envOk === false} className="w-full">
                {loading ? t("sendingResetLink") : t("sendResetLink")}
              </Button>
            ) : null}
          </form>
          <p className="mt-aistroyka-6 text-center text-aistroyka-subheadline text-aistroyka-text-secondary">
            <Link href="/login" className="font-medium text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded-aistroyka-sm">
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const tCommon = useTranslations("common");
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-aistroyka-4 py-aistroyka-8 text-center text-aistroyka-subheadline text-aistroyka-text-secondary">{tCommon("loading")}</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
