"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type SupportTicket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

type TicketMessage = {
  id: string;
  author_type: "user" | "platform_owner";
  body: string;
  created_at: string;
};

export function SupportClient({ skin = "default" }: { skin?: "default" | "canon" }) {
  const t = useTranslations("dashboard.supportPage");
  const locale = useLocale();
  const isCanon = skin === "canon";
  const shell = isCanon ? "canon-glass p-4" : "card";
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === activeTicketId) ?? null,
    [tickets, activeTicketId]
  );

  async function loadTickets() {
    const response = await fetch("/api/v1/support/tickets", { credentials: "include" });
    const json = await response.json().catch(() => ({}));
    if (response.ok) {
      setTickets((json.data ?? []) as SupportTicket[]);
      if (!activeTicketId && Array.isArray(json.data) && json.data.length > 0) {
        setActiveTicketId(json.data[0].id);
      }
    }
  }

  async function loadMessages(ticketId: string) {
    const response = await fetch(`/api/v1/support/tickets/${ticketId}/messages`, {
      credentials: "include",
    });
    const json = await response.json().catch(() => ({}));
    if (response.ok) {
      setMessages((json.data ?? []) as TicketMessage[]);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  useEffect(() => {
    if (activeTicketId) {
      void loadMessages(activeTicketId);
    } else {
      setMessages([]);
    }
  }, [activeTicketId]);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/v1/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject,
          message,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(json.error ?? t("createFailed"));
        return;
      }
      setSubject("");
      setMessage("");
      await loadTickets();
      if (json.data?.id) {
        setActiveTicketId(json.data.id as string);
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTicketId || !reply.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/support/tickets/${activeTicketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: reply }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(json.error ?? t("sendFailed"));
        return;
      }
      setReply("");
      await loadMessages(activeTicketId);
      await loadTickets();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-aistroyka-title2 font-bold text-aistroyka-text-primary">{t("title")}</h1>
        <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {t("subtitle")}
        </p>
      </header>

      <form onSubmit={createTicket} className={`${shell} space-y-3`}>
        <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{t("newRequest")}</h2>
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder={t("subjectPlaceholder")}
          className="input-field"
          required
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t("messagePlaceholder")}
          className="input-field min-h-28"
          required
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t("sending") : t("createTicket")}
        </button>
        {error ? <p className="text-sm text-aistroyka-error">{error}</p> : null}
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={shell}>
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{t("myTickets")}</h2>
          <ul className="mt-3 space-y-2">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  className={`w-full rounded-card border px-3 py-2 text-left ${
                    ticket.id === activeTicketId
                      ? "border-aistroyka-accent bg-aistroyka-accent-light"
                      : "border-aistroyka-border-subtle"
                  }`}
                  onClick={() => setActiveTicketId(ticket.id)}
                >
                  <p className="text-sm font-medium text-aistroyka-text-primary">{ticket.subject}</p>
                  <p className="text-xs text-aistroyka-text-tertiary">
                    {ticket.status} · {new Date(ticket.updated_at).toLocaleString(locale)}
                  </p>
                </button>
              </li>
            ))}
            {tickets.length === 0 ? (
              <li className="text-sm text-aistroyka-text-tertiary">{t("noTickets")}</li>
            ) : null}
          </ul>
        </section>

        <section className={shell}>
          <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">{t("thread")}</h2>
          {activeTicket ? (
            <>
              <p className="mt-2 text-sm text-aistroyka-text-secondary">
                {activeTicket.subject} ({activeTicket.status})
              </p>
              <ul className="mt-3 max-h-64 space-y-2 overflow-auto">
                {messages.map((msg) => (
                  <li key={msg.id} className="rounded-card border border-aistroyka-border-subtle px-3 py-2">
                    <p className="text-xs text-aistroyka-text-tertiary">
                      {msg.author_type === "platform_owner" ? t("authorSupport") : t("authorYou")} ·{" "}
                      {new Date(msg.created_at).toLocaleString(locale)}
                    </p>
                    <p className="mt-1 text-sm text-aistroyka-text-primary">{msg.body}</p>
                  </li>
                ))}
                {messages.length === 0 ? (
                  <li className="text-sm text-aistroyka-text-tertiary">{t("noMessages")}</li>
                ) : null}
              </ul>
              <form onSubmit={sendReply} className="mt-3 space-y-2">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder={t("replyPlaceholder")}
                  className="input-field min-h-20"
                  required
                />
                <button type="submit" className="btn-secondary" disabled={loading || !reply.trim()}>
                  {t("sendMessage")}
                </button>
              </form>
            </>
          ) : (
            <p className="mt-3 text-sm text-aistroyka-text-tertiary">{t("selectTicket")}</p>
          )}
        </section>
      </div>
    </section>
  );
}
