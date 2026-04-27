/**
 * Optional transactional email (invite, etc.). No new npm dependency — uses Resend HTTP API when configured.
 */
import { getServerConfig } from "@/lib/config/server";
import { getPublicConfig } from "@/lib/config";

export type SendEmailResult = { ok: boolean; error?: string };

export async function sendTransactionalEmailIfConfigured(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<SendEmailResult> {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = getServerConfig() as {
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
  };
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return { ok: false, error: "email_not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [params.to],
        subject: params.subject,
        text: params.text,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: t.slice(0, 200) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send_failed" };
  }
}

export function getAppOriginForLinks(): string {
  const { NEXT_PUBLIC_APP_URL } = getPublicConfig();
  return NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
}
