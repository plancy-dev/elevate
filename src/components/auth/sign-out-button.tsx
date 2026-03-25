"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-text-tertiary transition-colors hover:bg-layer-02 hover:text-text-primary"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </button>
  );
}
