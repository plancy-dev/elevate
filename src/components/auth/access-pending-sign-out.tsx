"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { clearRecoveryPendingClient } from "@/lib/auth-recovery-cookie";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Sign-out for `/access-pending` only: no `next-intl` / `useTranslations` (auth routes
 * are outside `NextIntlClientProvider`).
 */
export function AccessPendingSignOut({
  label,
  redirectTo = "/login",
}: {
  label: string;
  redirectTo?: string;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearRecoveryPendingClient();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className={cn(
        "flex w-full items-center justify-center gap-2 px-2 py-1.5 text-xs text-ink-500 transition-colors duration-80 ease-(--ease-editorial) hover:bg-paper-100 hover:text-ink-900",
      )}
    >
      <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
