"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NavLogout() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-gray-900"
    >
      Log out
    </button>
  );
}
