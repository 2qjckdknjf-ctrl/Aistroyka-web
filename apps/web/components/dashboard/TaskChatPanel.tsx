"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { subscribeTaskMessages } from "@/lib/realtime/task-messages-realtime";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type ChatMessage = {
  id: string;
  sender_user_id: string;
  kind: "text" | "voice" | "image" | "video" | string;
  body: string | null;
  upload_session_id: string | null;
  duration_ms: number | null;
  client_id: string | null;
  created_at: string;
  deleted_at?: string | null;
  mime_type?: string | null;
  object_path?: string | null;
  media_url?: string | null;
};

const READ_WATERMARK_KEY = "aistroyka.taskChat.lastReadAt";

function markTaskChatRead(taskId: string, iso: string) {
  try {
    const raw = localStorage.getItem(READ_WATERMARK_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[taskId] = iso;
    localStorage.setItem(READ_WATERMARK_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function kindFromFile(file: File): "image" | "video" | "voice" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "voice";
  return null;
}

async function uploadChatMedia(file: File): Promise<{ mediaId: string; mime: string }> {
  const createRes = await fetch("/api/v1/media/upload-sessions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ purpose: "task_chat" }),
  });
  if (!createRes.ok) throw new Error("upload_session_create_failed");
  const created = (await createRes.json()) as {
    data?: { id: string; upload_path: string };
  };
  const sessionId = created.data?.id;
  const uploadPath = created.data?.upload_path;
  if (!sessionId || !uploadPath) throw new Error("upload_session_invalid");

  const supabase = createClient();
  const pathInBucket = uploadPath.startsWith("media/")
    ? uploadPath.slice("media/".length)
    : uploadPath;
  const { error: putError } = await supabase.storage.from("media").upload(pathInBucket, file, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });
  if (putError) throw new Error(putError.message);

  const finalizeRes = await fetch(`/api/v1/media/upload-sessions/${sessionId}/finalize`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({
      object_path: uploadPath,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    }),
  });
  if (!finalizeRes.ok) throw new Error("upload_session_finalize_failed");
  return { mediaId: sessionId, mime: file.type };
}

export function TaskChatPanel({ taskId }: { taskId: string }) {
  const t = useTranslations("dashboardDetail");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/messages?limit=80`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("load_failed");
      const json = (await res.json()) as { data?: ChatMessage[] };
      const rows = json.data ?? [];
      setMessages(rows);
      setError(null);
      const last = rows[rows.length - 1];
      if (last?.created_at) markTaskChatRead(taskId, last.created_at);
    } catch {
      setError(t("taskChatError"));
    } finally {
      setLoading(false);
    }
  }, [taskId, t]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
    const unsub = subscribeTaskMessages(supabase, taskId, {
      onInsert: (row) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === row.id)) return prev;
          if (row.client_id && prev.some((m) => m.client_id === row.client_id)) {
            return prev.map((m) =>
              m.client_id === row.client_id
                ? {
                    ...m,
                    id: row.id,
                    created_at: row.created_at,
                    body: row.body,
                    kind: row.kind,
                  }
                : m
            );
          }
          return [
            ...prev,
            {
              id: row.id,
              sender_user_id: row.sender_user_id,
              kind: row.kind,
              body: row.body,
              upload_session_id: row.upload_session_id,
              duration_ms: row.duration_ms,
              client_id: row.client_id,
              created_at: row.created_at,
            },
          ];
        });
        // Reload to attach signed media_url for non-text inserts.
        if (row.kind !== "text") void loadMessages();
        markTaskChatRead(taskId, row.created_at);
      },
      onUpdate: (row) => {
        if (row.deleted_at) {
          setMessages((prev) => prev.filter((m) => m.id !== row.id));
        }
      },
    });
    return unsub;
  }, [taskId, loadMessages]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendText = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const clientId = crypto.randomUUID();
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": clientId,
        },
        body: JSON.stringify({ kind: "text", body, clientId }),
      });
      if (!res.ok) throw new Error("send_failed");
      const json = (await res.json()) as { data?: ChatMessage };
      if (json.data) {
        setMessages((prev) =>
          prev.some((m) => m.id === json.data!.id) ? prev : [...prev, json.data!]
        );
      }
      setText("");
    } catch {
      setError(t("taskChatSendError"));
    } finally {
      setSending(false);
    }
  };

  const sendMediaFile = async (file: File, durationMs?: number) => {
    const kind = kindFromFile(file);
    if (!kind) return;
    setSending(true);
    const clientId = crypto.randomUUID();
    try {
      const { mediaId } = await uploadChatMedia(file);
      const res = await fetch(`/api/v1/tasks/${taskId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": clientId,
        },
        body: JSON.stringify({
          kind,
          mediaId,
          durationMs,
          clientId,
        }),
      });
      if (!res.ok) throw new Error("send_failed");
      const json = (await res.json()) as { data?: ChatMessage };
      if (json.data) {
        setMessages((prev) =>
          prev.some((m) => m.id === json.data!.id) ? prev : [...prev, json.data!]
        );
      }
    } catch {
      setError(t("taskChatSendError"));
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/messages/${messageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("delete_failed");
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      setError(t("taskChatSendError"));
    }
  };

  const startRecording = async () => {
    if (recording || sending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const recorder = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const mime = recorder.mimeType || "audio/mp4";
        if (!mime.startsWith("audio/mp4") && !mime.includes("m4a") && mime !== "audio/aac") {
          // Chat finalize allow-list is m4a/mp4/aac — skip unsupported browser codecs.
          setError(t("taskChatSendError"));
          return;
        }
        const blob = new Blob(chunksRef.current, { type: mime });
        const file = new File([blob], `voice-${Date.now()}.m4a`, { type: "audio/mp4" });
        void sendMediaFile(file);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError(t("taskChatSendError"));
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !recording) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const labelForKind = (kind: string) => {
    switch (kind) {
      case "voice":
        return t("taskChatVoice");
      case "image":
        return t("taskChatPhoto");
      case "video":
        return t("taskChatVideo");
      default:
        return kind;
    }
  };

  return (
    <DashboardGlassCard className="p-4 space-y-3 mt-4">
      <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
        {t("taskChatTitle")}
      </h3>
      {error ? <p className="text-aistroyka-caption text-aistroyka-error">{error}</p> : null}
      <div
        ref={listRef}
        className="max-h-80 overflow-y-auto space-y-2 rounded-lg border border-aistroyka-border bg-aistroyka-surface-secondary/40 p-3"
      >
        {loading ? (
          <p className="text-aistroyka-caption text-aistroyka-text-secondary">{t("taskChatLoading")}</p>
        ) : messages.length === 0 ? (
          <p className="text-aistroyka-caption text-aistroyka-text-secondary">{t("taskChatEmpty")}</p>
        ) : (
          messages.map((m) => {
            const mine = userId != null && m.sender_user_id === userId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-aistroyka-accent text-white"
                      : "bg-aistroyka-surface-primary text-aistroyka-text-primary border border-aistroyka-border"
                  }`}
                >
                  {m.kind === "text" ? (
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  ) : m.kind === "voice" && m.media_url ? (
                    <audio controls src={m.media_url} className="max-w-full" preload="metadata" />
                  ) : m.kind === "image" && m.media_url ? (
                    <button type="button" onClick={() => setLightboxUrl(m.media_url!)} className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.media_url} alt={t("taskChatPhoto")} className="max-h-48 rounded-lg" />
                    </button>
                  ) : m.kind === "video" && m.media_url ? (
                    <video
                      controls
                      src={m.media_url}
                      className="max-h-48 rounded-lg"
                      onDoubleClick={() => setLightboxUrl(m.media_url!)}
                    />
                  ) : (
                    <p>
                      {labelForKind(m.kind)}
                      {m.body ? ` — ${m.body}` : ""}
                      {m.duration_ms != null ? ` (${Math.round(m.duration_ms / 1000)}s)` : ""}
                    </p>
                  )}
                  <div
                    className={`mt-1 flex items-center justify-between gap-2 text-[10px] ${
                      mine ? "text-white/70" : "text-aistroyka-text-tertiary"
                    }`}
                  >
                    <span>{new Date(m.created_at).toLocaleString()}</span>
                    {mine ? (
                      <button
                        type="button"
                        className="underline opacity-80 hover:opacity-100"
                        onClick={() => void deleteMessage(m.id)}
                      >
                        {t("taskChatDelete")}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="" className="max-h-full max-w-full rounded-lg" />
        </div>
      ) : null}
      <div className="flex flex-wrap items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={t("taskChatPlaceholder")}
          className="min-w-[12rem] flex-1 rounded-lg border border-aistroyka-border bg-aistroyka-surface-primary px-3 py-2 text-sm text-aistroyka-text-primary"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendText();
            }
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,video/mp4,audio/mp4,audio/m4a,audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void sendMediaFile(file);
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={sending}
          onClick={() => fileInputRef.current?.click()}
        >
          {t("taskChatAttach")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={sending}
          onMouseDown={() => void startRecording()}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={() => void startRecording()}
          onTouchEnd={stopRecording}
        >
          {recording ? t("taskChatRecording") : t("taskChatRecordVoice")}
        </Button>
        <Button size="sm" disabled={sending || !text.trim()} onClick={() => void sendText()}>
          {t("taskChatSend")}
        </Button>
      </div>
    </DashboardGlassCard>
  );
}
