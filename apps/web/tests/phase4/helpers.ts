import { expect, type APIRequestContext, type APIResponse } from "@playwright/test";
import { randomUUID } from "node:crypto";

export type MobileProfile =
  | "ios_worker"
  | "android_worker"
  | "ios_manager"
  | "android_manager"
  | "ios_lite"
  | "android_lite";

export type AuthSession = {
  accessToken: string;
  userId: string;
};

export type MePayload = {
  tenant_id: string | null;
  user_id: string | null;
  role: string | null;
};

type PersonaKey = "manager" | "workerA" | "workerB";

const PERSONA_ENV: Record<PersonaKey, { email: string; password: string }> = {
  manager: { email: "PHASE4_MANAGER_EMAIL", password: "PHASE4_MANAGER_PASSWORD" },
  workerA: { email: "PHASE4_WORKER_A_EMAIL", password: "PHASE4_WORKER_A_PASSWORD" },
  workerB: { email: "PHASE4_WORKER_B_EMAIL", password: "PHASE4_WORKER_B_PASSWORD" },
};

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function requireEnv(key: string): string {
  const value = readEnv(key);
  if (!value) {
    throw new Error(`Phase 4 required env ${key} missing after preflight.`);
  }
  return value;
}

export function requiredFixture() {
  return {
    baseUrl: requireEnv("PHASE4_BASE_URL"),
    projectId: requireEnv("PHASE4_PROJECT_ID"),
    workerATaskId: requireEnv("PHASE4_WORKER_A_TASK_ID"),
    workerBTaskId: requireEnv("PHASE4_WORKER_B_TASK_ID"),
    deviceA: requireEnv("PHASE4_DEVICE_A_ID"),
    deviceB: requireEnv("PHASE4_DEVICE_B_ID"),
  };
}

export function personaCredentials(key: PersonaKey): { email: string; password: string } {
  const spec = PERSONA_ENV[key];
  return {
    email: requireEnv(spec.email),
    password: requireEnv(spec.password),
  };
}

export function mobileHeaders(
  profile: MobileProfile,
  options?: { accessToken?: string; deviceId?: string; idempotencyKey?: string }
): Record<string, string> {
  return {
    "x-client": profile,
    "x-device-id": options?.deviceId ?? `phase4-${profile}-${randomUUID()}`,
    "x-idempotency-key": options?.idempotencyKey ?? `phase4-${profile}-${randomUUID()}`,
    ...(options?.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
  };
}

export async function authPasswordGrant(
  request: APIRequestContext,
  credentials: { email: string; password: string }
): Promise<AuthSession> {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const res = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: anonKey,
      "content-type": "application/json",
    },
    data: {
      email: credentials.email,
      password: credentials.password,
    },
  });
  expect(res.status(), "Supabase password grant must succeed").toBe(200);
  const body = (await res.json()) as {
    access_token?: string;
    user?: { id?: string };
  };
  expect(body.access_token, "access token").toBeTruthy();
  expect(body.user?.id, "auth user id").toBeTruthy();
  return { accessToken: body.access_token!, userId: body.user!.id! };
}

export async function me(request: APIRequestContext, accessToken: string): Promise<MePayload> {
  const res = await request.get("/api/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(res.status(), "/api/v1/me").toBe(200);
  const body = (await res.json()) as { data?: MePayload };
  expect(body.data?.tenant_id, "tenant_id").toBeTruthy();
  expect(body.data?.user_id, "user_id").toBeTruthy();
  return body.data!;
}

export async function readJson(res: APIResponse): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return { raw: (await res.text()).slice(0, 200) };
  }
}

export async function expectLiteForbidden(res: APIResponse, label: string): Promise<void> {
  expect(res.status(), label).toBe(403);
  const body = (await readJson(res)) as { code?: string; error?: string };
  expect(body.code, label).toBe("lite_client_path_forbidden");
}
