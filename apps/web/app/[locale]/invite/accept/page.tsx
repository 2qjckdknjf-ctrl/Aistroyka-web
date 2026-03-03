"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

function AcceptInviteContent() {
  const t = useTranslations("team");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "need_login" | "accepting" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t("missingToken"));
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setStatus("need_login");
        return;
      }
      setStatus("accepting");
      fetch("/api/tenant/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json().catch(() => ({})))
        .then((data) => {
          if (data.error) {
            setStatus("error");
            setErrorMessage(data.error);
            return;
          }
          setStatus("success");
          setTimeout(() => router.replace("/dashboard"), 2000);
        })
        .catch(() => {
          setStatus("error");
          setErrorMessage(t("acceptError"));
        });
    });
  }, [token, router, t]);

  if (status === "loading" || status === "accepting") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-aistroyka-4">
        <p className="text-aistroyka-subheadline text-aistroyka-text-secondary">{status === "accepting" ? t("accepting") : tCommon("loading")}</p>
      </main>
    );
  }

  if (status === "need_login") {
    const loginUrl = `/login?next=${encodeURIComponent("/invite/accept?token=" + token)}`;
    return (
      <main className="mx-auto max-w-md px-aistroyka-4 py-aistroyka-8">
        <div className="card-elevated text-center">
          <h1 className="text-aistroyka-title2 font-bold text-aistroyka-text-primary">{t("acceptInviteTitle")}</h1>
          <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">Sign in to accept this invitation.</p>
          <Link href={loginUrl} className="btn-primary mt-aistroyka-6 inline-block">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="mx-auto max-w-md px-aistroyka-4 py-aistroyka-8">
        <div className="card-elevated text-center">
          <h1 className="text-aistroyka-title2 font-bold text-aistroyka-text-primary">{t("acceptInviteTitle")}</h1>
          <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-error" role="alert">{errorMessage}</p>
          <Link href="/dashboard" className="btn-secondary mt-aistroyka-6 inline-block">
            {t("goToDashboard")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-aistroyka-4 py-aistroyka-8">
      <div className="card-elevated text-center">
        <h1 className="text-aistroyka-title2 font-bold text-aistroyka-text-primary">{t("acceptInviteTitle")}</h1>
        <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-success">{t("acceptSuccess")}</p>
        <p className="mt-aistroyka-1 text-aistroyka-caption text-aistroyka-text-tertiary">{t("redirectingToDashboard")}</p>
      </div>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<main className="flex min-h-[60vh] items-center justify-center px-aistroyka-4"><p className="text-aistroyka-subheadline text-aistroyka-text-secondary">…</p></main>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
