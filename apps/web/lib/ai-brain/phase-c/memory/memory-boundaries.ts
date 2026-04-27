/**
 * AI Brain Phase C — Memory acceptance and invalidation rules.
 */

import type { AiMemoryType } from "./memory.types";

const SESSION_TTL_HOURS = 1;
const PROJECT_WORKING_TTL_DAYS = 7;
const USER_PREFERENCE_TTL_DAYS = 90;
const LEARNING_CANDIDATE_TTL_DAYS = 30;

export function getDefaultTtlDays(memoryType: AiMemoryType): number | null {
  switch (memoryType) {
    case "session":
      return null;
    case "project_working":
      return PROJECT_WORKING_TTL_DAYS;
    case "user_preference":
      return USER_PREFERENCE_TTL_DAYS;
    case "learning_candidate":
      return LEARNING_CANDIDATE_TTL_DAYS;
    default:
      return 7;
  }
}

export function computeExpiresAt(memoryType: AiMemoryType, createdAt: Date): string | null {
  switch (memoryType) {
    case "session":
      const h = new Date(createdAt);
      h.setHours(h.getHours() + SESSION_TTL_HOURS);
      return h.toISOString();
    case "project_working": {
      const d = new Date(createdAt);
      d.setDate(d.getDate() + PROJECT_WORKING_TTL_DAYS);
      return d.toISOString();
    }
    case "user_preference": {
      const u = new Date(createdAt);
      u.setDate(u.getDate() + USER_PREFERENCE_TTL_DAYS);
      return u.toISOString();
    }
    case "learning_candidate": {
      const l = new Date(createdAt);
      l.setDate(l.getDate() + LEARNING_CANDIDATE_TTL_DAYS);
      return l.toISOString();
    }
    default:
      return null;
  }
}

export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}
