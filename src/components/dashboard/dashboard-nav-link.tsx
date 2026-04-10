"use client";

import Link, { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

function NavLinkPendingIndicator({
  layout,
}: {
  layout: "row" | "inline";
}) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className={cn(
        "pointer-events-none absolute flex h-4 w-4 items-center justify-center",
        layout === "row" && "right-2.5 top-1/2 -translate-y-1/2",
        layout === "inline" && "right-0 top-1/2 -translate-y-1/2",
      )}
      aria-hidden
    >
      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </span>
  );
}

export type DashboardNavLinkProps = ComponentProps<typeof Link> & {
  /** `row`: sidebar / card rows (default). `inline`: text links inside copy. */
  layout?: "row" | "inline";
};

/**
 * Dashboard in-app navigation: shows a small spinner while the Next.js App Router
 * navigation for this link is in flight (`useLinkStatus`).
 */
export function DashboardNavLink({
  className,
  children,
  layout = "row",
  ...props
}: DashboardNavLinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        "relative",
        layout === "row" && "block pr-9",
        layout === "inline" && "inline pr-5",
        className,
      )}
    >
      {children}
      <NavLinkPendingIndicator layout={layout} />
    </Link>
  );
}
