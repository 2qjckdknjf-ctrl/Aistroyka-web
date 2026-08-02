export type RolePersona = "owner" | "manager" | "worker" | "client" | "platform_admin";

export type RoleCredentials = {
  persona: RolePersona;
  email: string;
  password: string;
};

const PERSONA_ENV: Record<RolePersona, [string, string]> = {
  owner: ["QA_OWNER_EMAIL", "QA_OWNER_PASSWORD"],
  manager: ["QA_MANAGER_EMAIL", "QA_MANAGER_PASSWORD"],
  worker: ["QA_WORKER_EMAIL", "QA_WORKER_PASSWORD"],
  client: ["QA_CLIENT_EMAIL", "QA_CLIENT_PASSWORD"],
  platform_admin: ["QA_PLATFORM_OWNER_EMAIL", "QA_PLATFORM_OWNER_PASSWORD"],
};

export function resolveRoleCredentials(persona: RolePersona): RoleCredentials | null {
  const [emailKey, passKey] = PERSONA_ENV[persona];
  const email = process.env[emailKey] || (persona === "owner" ? process.env.E2E_EMAIL || process.env.E2E_USER_EMAIL : undefined);
  const password =
    process.env[passKey] || (persona === "owner" ? process.env.E2E_PASSWORD || process.env.E2E_USER_PASSWORD : undefined);
  if (!email || !password) return null;
  return { persona, email, password };
}

export function requireRoleOrSkip(persona: RolePersona, test: { skip: (condition: boolean, reason: string) => void }): RoleCredentials {
  const creds = resolveRoleCredentials(persona);
  if (!creds) {
    test.skip(true, `Missing credentials for ${persona}; set ${PERSONA_ENV[persona].join(" / ")} or E2E_EMAIL for owner.`);
  }
  return creds!;
}
