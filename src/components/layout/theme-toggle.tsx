"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function ThemeToggleInner({
  labels,
  className,
}: {
  labels: { light: string; dark: string; system: string; aria: string };
  className?: string;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-8 w-[7.5rem] shrink-0 rounded-sm border border-border-subtle bg-layer-02",
          className,
        )}
        aria-hidden
      />
    );
  }

  const cycle: Array<"light" | "dark" | "system"> = [
    "light",
    "dark",
    "system",
  ];
  const current = theme ?? "system";
  const idx = cycle.indexOf(current as "light" | "dark" | "system");
  const next = cycle[(idx + 1) % cycle.length];

  return (
    <button
      type="button"
      aria-label={labels.aria}
      title={`${labels.light} / ${labels.dark} / ${labels.system}`}
      className={cn(
        "flex h-8 shrink-0 items-center gap-2 rounded-sm border border-border-subtle bg-layer-01 px-3 text-xs text-text-secondary",
        "shadow-none outline-none transition-colors",
        "hover:bg-layer-02 hover:text-text-primary",
        "focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25",
        className,
      )}
      onClick={() => setTheme(next)}
    >
      {current === "light" ||
      (current === "system" && resolvedTheme === "light") ? (
        <Sun className="h-3.5 w-3.5 shrink-0 text-warning" />
      ) : current === "dark" ||
        (current === "system" && resolvedTheme === "dark") ? (
        <Moon className="h-3.5 w-3.5 shrink-0 text-info" />
      ) : (
        <Monitor className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="max-[380px]:hidden">
        {current === "system"
          ? labels.system
          : current === "dark"
            ? labels.dark
            : labels.light}
      </span>
    </button>
  );
}

/** Use in marketing (localized). */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("ThemeToggle");
  return (
    <ThemeToggleInner
      className={className}
      labels={{
        light: t("light"),
        dark: t("dark"),
        system: t("system"),
        aria: t("aria"),
      }}
    />
  );
}

/** Use in dashboard / auth where next-intl is not mounted. */
export function ThemeToggleEnglish({ className }: { className?: string }) {
  return (
    <ThemeToggleInner
      className={className}
      labels={{
        light: "Light",
        dark: "Dark",
        system: "System",
        aria: "Toggle color theme",
      }}
    />
  );
}
