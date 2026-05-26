"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card, Alert } from "@/components/ui";
import { AuthProviderButtons } from "@/components/auth/AuthProviderButtons";

type MethodsResponse = {
  methods: {
    email: boolean;
    apple: boolean;
    telegram: boolean;
  };
  linkedCount: number;
};

async function fetchMethods(): Promise<MethodsResponse> {
  const res = await fetch("/api/v1/auth/methods", { credentials: "include" });
  if (!res.ok) {
    throw new Error("load_failed");
  }
  return res.json();
}

async function unlinkProvider(provider: "apple" | "telegram"): Promise<MethodsResponse> {
  const res = await fetch("/api/v1/auth/methods", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "unlink", provider }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "unlink_failed");
  }
  return data as MethodsResponse;
}

export function AuthMethodsSettingsCard() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MethodsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<"apple" | "telegram" | null>(null);

  useEffect(() => {
    void fetchMethods()
      .then((result) => {
        setData(result);
      })
      .catch(() => {
        setError(t("methodsLoadFailed"));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [t]);

  async function handleUnlink(provider: "apple" | "telegram") {
    setError(null);
    setUnlinking(provider);
    try {
      const next = await unlinkProvider(provider);
      setData(next);
    } catch (thrown) {
      const message = thrown instanceof Error ? thrown.message : "unlink_failed";
      if (message === "last_method_forbidden") {
        setError(t("unlinkLastMethodForbidden"));
      } else {
        setError(t("unlinkFailed"));
      }
    } finally {
      setUnlinking(null);
    }
  }

  const nextToComeBack = `/${locale}/dashboard/settings/auth`;

  return (
    <Card className="p-5">
      <h1 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
        {t("linkedMethodsTitle")}
      </h1>
      <p className="mt-2 text-sm text-aistroyka-text-secondary">{t("linkedMethodsHint")}</p>

      {loading ? (
        <p className="mt-4 text-sm text-aistroyka-text-secondary">{t("loadingMethods")}</p>
      ) : null}

      {error ? <Alert message={error} style="error" className="mt-4" /> : null}

      {data ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle px-3 py-2">
            <span>{t("methodEmail")}</span>
            <span className="text-aistroyka-text-secondary">{data.methods.email ? t("methodLinked") : t("methodNotLinked")}</span>
          </div>
          <div className="flex items-center justify-between rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle px-3 py-2">
            <span>{t("methodApple")}</span>
            <div className="flex items-center gap-2">
              <span className="text-aistroyka-text-secondary">{data.methods.apple ? t("methodLinked") : t("methodNotLinked")}</span>
              {data.methods.apple ? (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={unlinking === "apple"}
                  onClick={() => {
                    void handleUnlink("apple");
                  }}
                >
                  {t("unlink")}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle px-3 py-2">
            <span>{t("methodTelegram")}</span>
            <div className="flex items-center gap-2">
              <span className="text-aistroyka-text-secondary">{data.methods.telegram ? t("methodLinked") : t("methodNotLinked")}</span>
              {data.methods.telegram ? (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={unlinking === "telegram"}
                  onClick={() => {
                    void handleUnlink("telegram");
                  }}
                >
                  {t("unlink")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <AuthProviderButtons
          mode="login"
          appleIntent="link"
          nextPath={nextToComeBack}
          hideEmailButton
          onContinueEmail={() => {
            // no-op in settings; email is already the primary method
          }}
        />
      </div>
    </Card>
  );
}
