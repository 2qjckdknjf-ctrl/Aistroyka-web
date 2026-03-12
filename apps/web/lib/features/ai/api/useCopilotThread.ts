"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/engine/queryKeys";
import type { ChatThread, ChatMessage } from "../types";
import type { DecisionContextPayload } from "@/lib/engine/types";
import {
  listThreads,
  getThread,
  createThread,
  archiveThread,
  sendChatMessage,
  type ServerMessageRow,
} from "./chatApi";

function mapServerMessage(m: ServerMessageRow): ChatMessage {
  return {
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    createdAt: m.created_at,
    requestId: m.request_id ?? undefined,
    lowConfidence: m.low_confidence ?? undefined,
    errorKind: (m.error_kind as ChatMessage["errorKind"]) ?? undefined,
  };
}

export function useCopilotThread(projectId: string | null) {
  const qc = useQueryClient();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const threadsQuery = useQuery({
    queryKey: projectId ? queryKeys.threads(projectId) : ["ai", "threads", ""],
    queryFn: async () => {
      if (!projectId) return [];
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      let session: { access_token?: string } | null = null;
      try {
        const res = await supabase.auth.getSession();
        session = res?.data?.session ?? null;
      } catch {
        // fallthrough
      }
      const getAuthToken = async () => session?.access_token ?? null;
      return listThreads(projectId, getAuthToken);
    },
    enabled: !!projectId,
  });

  const threads = threadsQuery.data ?? [];
  useEffect(() => {
    if (activeThreadId == null && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  const threadDetailQuery = useQuery({
    queryKey:
      projectId && activeThreadId
        ? queryKeys.threadDetail(projectId, activeThreadId)
        : ["ai", "threadDetail", "", ""],
    queryFn: async () => {
      if (!activeThreadId) return null;
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      let session: { access_token?: string } | null = null;
      try {
        const res = await supabase.auth.getSession();
        session = res?.data?.session ?? null;
      } catch {
        // fallthrough
      }
      const getAuthToken = async () => session?.access_token ?? null;
      return getThread(activeThreadId, getAuthToken);
    },
    enabled: !!projectId && !!activeThreadId,
  });

  const threadDetail = threadDetailQuery.data;
  const messages: ChatMessage[] = threadDetail?.messages?.map(mapServerMessage) ?? [];
  const thread: ChatThread | undefined =
    projectId && threadDetail
      ? { projectId, messages, threadId: activeThreadId ?? undefined }
      : projectId
        ? { projectId, messages: [] }
        : undefined;

  const sendMessageMutation = useMutation({
    mutationFn: async (variables: {
      message: string;
      decisionContext: DecisionContextPayload;
      getAuthToken: () => Promise<string | null>;
      locale: string | null;
      signal?: AbortSignal | null;
    }) => {
      if (!projectId) throw new Error("No projectId");
      return sendChatMessage(projectId, variables.getAuthToken, {
        thread_id: activeThreadId,
        user_text: variables.message.trim(),
        decision_context: variables.decisionContext,
        locale: variables.locale ?? null,
      });
    },
    onSuccess: (data, _variables) => {
      if (data.thread_id && !activeThreadId) {
        setActiveThreadId(data.thread_id);
      }
      if (projectId) {
        qc.invalidateQueries({ queryKey: queryKeys.threadDetail(projectId, data.thread_id) });
        qc.invalidateQueries({ queryKey: queryKeys.threads(projectId) });
      }
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) return null;
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      let session: { access_token?: string } | null = null;
      try {
        const res = await supabase.auth.getSession();
        session = res?.data?.session ?? null;
      } catch {
        // fallthrough
      }
      const getAuthToken = async () => session?.access_token ?? null;
      if (activeThreadId) {
        await archiveThread(activeThreadId, getAuthToken);
      }
      const newThread = await createThread(projectId, getAuthToken);
      return newThread.id;
    },
    onSuccess: (newThreadId) => {
      if (newThreadId) setActiveThreadId(newThreadId);
      if (projectId) {
        qc.invalidateQueries({ queryKey: queryKeys.threads(projectId) });
        qc.invalidateQueries({ queryKey: queryKeys.threadDetail(projectId, newThreadId!) });
      }
    },
  });

  const clearChat = () => {
    if (!projectId) return;
    clearChatMutation.mutate();
  };

  return {
    thread,
    threadId: activeThreadId,
    threads,
    isLoading: threadsQuery.isLoading || threadDetailQuery.isLoading,
    sendMessage: sendMessageMutation.mutateAsync,
    sendMessageMutation,
    clearChat,
    clearChatMutation,
  };
}
