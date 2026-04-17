"use client";

import { ChevronUp, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

/** Model + custom-instructions panel toggle used on pipeline step cards (replaces tiny Unicode gear). */
export function PipelineStepAdvancedToggle({ open, onToggle, disabled }: Props) {
  const t = useTranslations("Dashboard.productions");

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-text-secondary transition-colors",
        "border-border-subtle/90 bg-layer-02/70 hover:bg-layer-01 hover:text-text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "dark:border-border-subtle dark:bg-layer-02/50",
        open && "border-primary/35 bg-primary/10 text-primary",
        disabled && "pointer-events-none opacity-40",
      )}
      aria-expanded={open}
      aria-label={t("pipelineStepAdvancedToggleAria")}
      onClick={onToggle}
    >
      {open ? (
        <ChevronUp className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      ) : (
        <SlidersHorizontal className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
