"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  MapPin,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Events",
    href: "/dashboard/events",
    icon: Calendar,
  },
  {
    label: "Attendees",
    href: "/dashboard/attendees",
    icon: Users,
  },
  {
    label: "Venues",
    href: "/dashboard/venues",
    icon: MapPin,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
];

const bottomItems = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-border-subtle bg-layer-01">
      {/* Logo */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-border-subtle">
        <Link href="/dashboard">
          <ElevateLogo size="sm" />
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-highlight text-primary font-medium border-l-2 border-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-layer-02",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-border-subtle py-3 px-2 space-y-0.5">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-sm text-text-tertiary hover:text-text-primary hover:bg-layer-02 transition-colors"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* User */}
      <div className="border-t border-border-subtle p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-03">
            <span className="text-xs font-medium text-text-secondary">JK</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text-primary truncate">
              Jaekyeong Ko
            </div>
            <div className="text-xs text-text-tertiary truncate">
              Admin · Elevate Corp
            </div>
          </div>
          <div className="shrink-0">
            <SignOutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
