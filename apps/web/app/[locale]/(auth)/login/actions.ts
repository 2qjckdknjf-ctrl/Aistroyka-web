"use server";

import { createClient } from "@/lib/supabase/server";

export type SignInActionResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

export async function signInAction(
  email: string,
  password: string,
  traceId: string
): Promise<SignInActionResult> {
  const start = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    const durationMs = Date.now() - start;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[login] auth error", {
          traceId,
          message: error.message,
          durationMs,
        });
      }
      return { ok: false, errorMessage: error.message };
    }

    if (process.env.NODE_ENV === "development") {
      console.error("[login] signIn success", { traceId, durationMs });
    }
    return { ok: true };
  } catch (thrown) {
    const durationMs = Date.now() - start;
    const message = thrown instanceof Error ? thrown.message : String(thrown);
    if (process.env.NODE_ENV === "development") {
      console.error("[login] signIn failed", {
        traceId,
        errorMessage: message,
        durationMs,
      });
    }
    return {
      ok: false,
      errorMessage: message.length < 200 ? message : "Sign-in failed.",
    };
  }
}
