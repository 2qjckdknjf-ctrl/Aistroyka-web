"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/engine/queryKeys";
import { getThread, saveThread, clearThread, generateMessageId } from "../storage";
import type { ChatThread, ChatMessage } from "../types";
import { defaultTransport } from "../transport";
import type { DecisionContextPayload } from "@/lib/engine/types";

function getThreadOrEmpty(projectId: string): ChatThread {
  const t = getThread(projectId);
  return t ?? { projectId, messages: [] };
}

export function useCopilotThread(projectId: string | null) {
  const qc = useQueryClient();
  const key = projectId ? queryKeys.thread(projectId) : ["ai", "thread", ""];

  const query = useQuery({
    queryKey: key,
    queryFn: () => Promise.resolve(getThreadOrEmpty(projectId!)),
    enabled: !!projectId,
    initialData: projectId ? getThreadOrEmpty(projectId) : undefined,
  });

  const thread: ChatThread | undefined = query.data;

  const sendMessage = useMutation({
    mutationFn: async (variables: {
      message: string;
      decisionContext: DecisionContextPayload;
      getAuthToken: () => Promise<string | null>;
      tenantId: string | null;
      locale: string | null;
      signal?: AbortSignal | null;
    }) => {
      if (!projectId) throw new Error("No projectId");
      return defaultTransport.sendMessage({
        projectId,
        message: variables.message,
        decisionContext: variables.decisionContext,
        getAuthToken: variables.getAuthToken,
        tenantId: variables.tenantId,
        locale: variables.locale,
        signal: variables.signal ?? null,
      });
    },
    onMutate: async (variables) => {
      if (!projectId) return;
      const userMsg: ChatMessage = {
        id: generateMessageId(),
        role: "user",
        content: variables.message.trim(),
        createdAt: new Date().toISOString(),
      };
      const placeholder: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: "…",
        createdAt: new Date().toISOString(),
      };
      const prev = getThreadOrEmpty(projectId);
      const next: ChatThread = {
        projectId,
        messages: [...prev.messages, userMsg, placeholder],
      };
      qc.setQueryData(key, next);
      saveThread(next);
      return { placeholderId: placeholder.id };
    },
    onSuccess: (result, variables, context) => {
      if (!projectId || !context?.placeholderId) return;
      const prev = getThreadOrEmpty(projectId);
      const idx = prev.messages.findIndex((m) => m.id === context.placeholderId);
      if (idx === -1) return;
      if (result.ok) {
        const replacement: ChatMessage = {
          ...prev.messages[idx],
          content: result.finalText,
          requestId: result.requestId,
          lowConfidence: result.meta.lowConfidence,
          fallback_reason: result.meta.fallback_reason ?? null,
          error_category: result.meta.error_category ?? null,
        };
        const nextMessages = [...prev.messages];
        nextMessages[idx] = replacement;
        const next: ChatThread = { projectId, messages: nextMessages };
        qc.setQueryData(key, next);
        saveThread(next);
      } else {
        const replacement: ChatMessage = {
          ...prev.messages[idx],
          content: result.error.message,
          requestId: result.requestId,
          errorKind: result.error.kind,
        };
        const nextMessages = [...prev.messages];
        nextMessages[idx] = replacement;
        const next: ChatThread = { projectId, messages: nextMessages };
        qc.setQueryData(key, next);
        saveThread(next);
      }
    },
    onError: (_err, variables, context) => {
      if (!projectId || !context?.placeholderId) return;
      const prev = getThreadOrEmpty(projectId);
      const idx = prev.messages.findIndex((m) => m.id === context.placeholderId);
      if (idx === -1) return;
      const replacement: ChatMessage = {
        ...prev.messages[idx],
        content: "Request failed.",
        errorKind: "unknown",
      };
      const nextMessages = [...prev.messages];
      nextMessages[idx] = replacement;
      const next: ChatThread = { projectId, messages: nextMessages };
      qc.setQueryData(key, next);
      saveThread(next);
    },
  });

  const clearChat = () => {
    if (!projectId) return;
    clearThread(projectId);
    qc.setQueryData(key, { projectId, messages: [] });
  };

  return {
    thread,
    isLoading: query.isLoading,
    sendMessage: sendMessage.mutateAsync,
    sendMessageMutation: sendMessage,
    clearChat,
  };
}
