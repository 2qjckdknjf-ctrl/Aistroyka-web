"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type InvitePreview = {
  tenantName: string;
  role: string;
  email: string;
  expiresAt: string;
};

type MobileLinks = {
  APP_STORE_WORKER_URL: string | null;
  GOOGLE_PLAY_WORKER_URL: string | null;
  APP_STORE_MANAGER_URL: string | null;
  GOOGLE_PLAY_MANAGER_URL: string | null;
};

function AcceptInviteContent() {
  const t = useTranslations("team");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const [status, setStatus] = useState<"loading" | "need_login" | "accepting" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(null);
  const [mobileLinks, setMobileLinks] = useState<MobileLinks | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t("missingToken"));
      return;
    }
    void fetch(`/api/v1/tenant/invite-preview?token=${encodeURIComponent(token)}`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data?.data) {
          setInvitePreview(data.data as InvitePreview);
        }
      })
      .catch(() => undefined);
    void fetch("/api/v1/mobile-links")
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data?.data) {
          setMobileLinks(data.data as MobileLinks);
        }
      })
      .catch(() => undefined);

    const supabase = createClient();
    supabase.auth.getSession().then((res) => {
      const session = res?.data?.session ?? null;
      if (!session) {
        setStatus("need_login");
        return;
      }
      setStatus("accepting");
      fetch("/api/v1/tenant/accept-invite", {
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
    const registerUrl = `/register?next=${encodeURIComponent("/invite/accept?token=" + token)}`;
    return (
      <main className="mx-auto max-w-md px-aistroyka-4 py-aistroyka-8">
        <div className="card-elevated text-center">
          <h1 className="text-aistroyka-title2 font-bold text-aistroyka-text-primary">{t("acceptInviteTitle")}</h1>
          <p className="mt-aistroyka-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
            {invitePreview?.tenantName
              ? `${invitePreview.tenantName} · ${invitePreview.role}`
              : t("signInToAccept")}
          </p>
          <p className="mt-aistroyka-2 text-aistroyka-caption text-aistroyka-text-tertiary">
            {t("inviteFlowHint")}
          </p>
          <div className="mt-aistroyka-6 flex flex-wrap items-center justify-center gap-2">
            <Link href={loginUrl} className="btn-primary inline-block">
              {t("signIn")}
            </Link>
            <Link href={registerUrl} className="btn-secondary inline-block">
              {t("register")}
            </Link>
          </div>
          <section className="mt-aistroyka-6 text-left">
            <h2 className="text-aistroyka-subheadline font-medium text-aistroyka-text-primary">{t("mobileAppsTitle")}</h2>
            <ul className="mt-aistroyka-2 space-y-1 text-aistroyka-caption text-aistroyka-text-secondary">
              <li>
                Worker iOS:{" "}
                {mobileLinks?.APP_STORE_WORKER_URL ? (
                  <a className="text-aistroyka-accent underline" href={mobileLinks.APP_STORE_WORKER_URL}>
                    {mobileLinks.APP_STORE_WORKER_URL}
                  </a>
                ) : (
                  t("comingSoon")
                )}
              </li>
              <li>
                Worker Android:{" "}
                {mobileLinks?.GOOGLE_PLAY_WORKER_URL ? (
                  <a className="text-aistroyka-accent underline" href={mobileLinks.GOOGLE_PLAY_WORKER_URL}>
                    {mobileLinks.GOOGLE_PLAY_WORKER_URL}
                  </a>
                ) : (
                  t("comingSoon")
                )}
              </li>
              <li>
                Manager iOS:{" "}
                {mobileLinks?.APP_STORE_MANAGER_URL ? (
                  <a className="text-aistroyka-accent underline" href={mobileLinks.APP_STORE_MANAGER_URL}>
                    {mobileLinks.APP_STORE_MANAGER_URL}
                  </a>
                ) : (
                  t("comingSoon")
                )}
              </li>
              <li>
                Manager Android:{" "}
                {mobileLinks?.GOOGLE_PLAY_MANAGER_URL ? (
                  <a className="text-aistroyka-accent underline" href={mobileLinks.GOOGLE_PLAY_MANAGER_URL}>
                    {mobileLinks.GOOGLE_PLAY_MANAGER_URL}
                  </a>
                ) : (
                  t("comingSoon")
                )}
              </li>
            </ul>
          </section>
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
