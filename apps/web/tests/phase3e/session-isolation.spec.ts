import { expect, test } from "@playwright/test";
import {
  assertMeRole,
  assertStorageEmptyOfPriorSession,
  attachMutationGuard,
  loginViaUi,
  newIsolatedContext,
  personaCredentials,
} from "./helpers";

test.describe("Phase 3E session isolation", () => {
  test("distinct BrowserContext per persona; no role bleed", async ({ browser }) => {
    const order = ["admin", "manager", "worker", "stakeholder", "smoke"] as const;
    const expectedRole: Record<(typeof order)[number], string> = {
      admin: "admin",
      manager: "member",
      worker: "member",
      stakeholder: "stakeholder",
      smoke: "admin",
    };
    const landOn: Record<(typeof order)[number], RegExp> = {
      admin: /\/(en|ru|es|it)\/(dashboard|admin)/,
      manager: /\/(en|ru|es|it)\/dashboard/,
      worker: /\/(en|ru|es|it)\/dashboard/,
      stakeholder: /\/(en|ru|es|it)\/portal\/projects/,
      smoke: /\/(en|ru|es|it)\/(dashboard|admin|platform-admin)/,
    };

    const emails = order.map((k) => personaCredentials(k).email.toLowerCase());
    expect(new Set(emails).size, "one credential pair must not map to two personas").toBe(emails.length);

    const contexts = [];
    try {
      for (const key of order) {
        const ctx = await newIsolatedContext(browser);
        await assertStorageEmptyOfPriorSession(ctx);
        const page = await ctx.newPage();
        const mutationGuard = attachMutationGuard(page);
        const { email, password } = personaCredentials(key);
        await loginViaUi(page, email, password, landOn[key]);
        const me = await assertMeRole(page, expectedRole[key]);
        expect(me.role).toBe(expectedRole[key]);
        mutationGuard.assertClean();
        contexts.push({ key, ctx, page });
      }

      // Logout one persona must not kill independent contexts
      await contexts[0].page.goto("/api/v1/auth/logout").catch(() => undefined);
      await contexts[0].ctx.clearCookies();
      const stillManager = await contexts[1].page.request.get("/api/v1/me");
      expect(stillManager.status()).toBe(200);
      const stillBody = (await stillManager.json()) as { data?: { role?: string } };
      expect(stillBody.data?.role).toBe("member");
    } finally {
      for (const c of contexts) {
        await c.ctx.close();
      }
    }
  });
});
