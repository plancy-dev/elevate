"use client";

import NextLink from "next/link";
import type { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { getInitialsFromDisplayName } from "@/lib/user-display";
import { buttonLinkClassName } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

type Props = {
  /** From `useAuthUser()` in the parent header — single Supabase subscription. */
  user: User | null | undefined;
  /** `sm` for desktop header, `md` for mobile sheet */
  size?: "sm" | "md";
  className?: string;
  /** e.g. close mobile nav after navigating */
  onNavigate?: () => void;
};

function displayLabel(user: User): string {
  const meta = user.user_metadata as { full_name?: string } | undefined;
  const fromMeta = meta?.full_name?.trim();
  if (fromMeta) return fromMeta;
  return user.email?.split("@")[0] ?? "—";
}

export function HeaderAuthCluster({
  user,
  size = "sm",
  className,
  onNavigate,
}: Props) {
  const t = useTranslations("Nav");

  const btnSize = size === "sm" ? "sm" : "md";

  if (user === undefined) {
    return (
      <div
        className={cn(
          "h-8 shrink-0 rounded-sm bg-layer-02 animate-pulse",
          size === "sm" ? "w-[7.5rem]" : "w-full",
        )}
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <NextLink
        href="/login"
        className={cn(
          buttonLinkClassName("ghost", btnSize, size === "md" ? "w-full" : undefined),
          className,
        )}
        onClick={() => onNavigate?.()}
      >
        {t("logIn")}
      </NextLink>
    );
  }

  const label = displayLabel(user);
  const email = user.email ?? "";
  const initials = getInitialsFromDisplayName(label);
  const title = email ? `${label} · ${email}` : label;

  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-0",
        size === "md" && "flex-col w-full items-stretch gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-center gap-2",
          size === "md" && "w-full",
        )}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-highlight text-xs font-semibold text-primary"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 text-left">
          {size === "md" ? (
            <>
              <p
                className="truncate text-xs font-medium text-text-primary"
                title={title}
              >
                {label}
              </p>
              {email ? (
                <p className="truncate text-[10px] text-text-tertiary" title={email}>
                  {email}
                </p>
              ) : null}
            </>
          ) : (
            <p
              className="max-w-[10rem] truncate text-xs font-medium text-text-primary xl:max-w-[12rem]"
              title={title}
            >
              {label}
            </p>
          )}
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-2 shrink-0",
          size === "md" && "w-full flex-col",
        )}
      >
        <NextLink
          href="/dashboard"
          className={buttonLinkClassName(
            "primary",
            btnSize,
            size === "md" ? "w-full" : undefined,
          )}
          onClick={() => onNavigate?.()}
        >
          {t("openDashboard")}
        </NextLink>
        <SignOutButton
          variant="marketing"
          redirectTo="/"
          className={cn(
            "justify-center",
            size === "md" ? "w-full py-2.5 text-sm" : "w-auto",
          )}
        />
      </div>
    </div>
  );
}
