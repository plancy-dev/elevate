"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { clearRecoveryPendingClient } from "@/lib/auth-recovery-cookie";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** After sign-out navigation (default: login). */
  redirectTo?: string;
  /** Marketing header uses `Nav.signOut`; dashboard sidebar uses `Dashboard.signOut`. */
  variant?: "dashboard" | "marketing";
  className?: string;
};

export function SignOutButton({
  redirectTo = "/login",
  variant = "dashboard",
  className,
}: Props) {
  const tDash = useTranslations("Dashboard");
  const tNav = useTranslations("Nav");
  const router = useRouter();
  const label = variant === "marketing" ? tNav("signOut") : tDash("signOut");

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
      onClick={signOut}
      className={cn(
        "flex w-full items-center gap-2 px-2 py-1.5 text-xs text-ink-500 transition-colors duration-80 ease-(--ease-editorial) hover:bg-paper-100 hover:text-ink-900",
        className,
      )}
    >
      <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
