"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Dialog accessible name (visible title). */
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Panel width: default large form; integrations uses max-w-3xl. */
  size?: "md" | "lg" | "xl" | "2xl";
  /** Stacking when multiple modals (e.g. confirm over editor). */
  stackClassName?: string;
  /** Override `aria-labelledby` id (default `modal-title`). */
  titleId?: string;
};

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-3xl",
  "2xl": "max-w-4xl",
};

/**
 * App-modal pattern (matches admin dialogs): overlay + scroll body, Esc + backdrop close.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "lg",
  stackClassName,
  titleId: titleIdProp,
}: Props) {
  const titleId = titleIdProp ?? "modal-title";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-black/50 p-4",
        stackClassName ?? "z-80",
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? "modal-desc" : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto rounded-xl border border-border-subtle bg-layer-01 p-5 shadow-card",
          sizeClass[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            {description ? (
              <p id="modal-desc" className="mt-1 text-sm text-text-secondary">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-text-tertiary transition-colors hover:bg-layer-02 hover:text-text-primary"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
