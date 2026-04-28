"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";
import { ShortcutBadge } from "@/components/desk/ShortcutBadge";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl" | "2xl";
  stackClassName?: string;
  titleId?: string;
};

const sizeClass: Record<NonNullable<ModalProps["size"]>, string> = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-3xl",
  "2xl": "sm:max-w-4xl",
};

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
}: ModalProps) {
  const titleId = titleIdProp ?? "modal-title";
  const layerClassName = stackClassName ?? "z-80";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 bg-ink-900/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            layerClassName,
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 max-h-[85vh] w-full border-t border-ink-700 bg-paper-50 text-ink-900 p-4 pb-5 outline-none",
            "data-[state=open]:translate-y-0 data-[state=closed]:translate-y-full transition-transform duration-[160ms] [transition-timing-function:var(--ease-editorial)]",
            "sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:inset-x-auto sm:w-[min(100vw-2rem,56rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border sm:border-ink-700 sm:p-6",
            "sm:data-[state=open]:translate-y-0 sm:data-[state=closed]:translate-y-0",
            sizeClass[size],
            layerClassName,
            className,
          )}
          aria-describedby={description ? "modal-desc" : undefined}
          onEscapeKeyDown={onClose}
          onPointerDownOutside={onClose}
        >
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-ink-100 pb-3">
            <div className="min-w-0 space-y-1">
              <Dialog.Title
                id={titleId}
                className="text-[1.5rem] leading-[1.1] [font-family:var(--font-display)] [font-variation-settings:'opsz'_144]"
              >
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description
                  id="modal-desc"
                  className="text-sm leading-relaxed text-ink-700"
                >
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 border border-ink-300 bg-paper-0 px-2 py-1 text-ink-700 transition-colors duration-[80ms] [transition-timing-function:var(--ease-editorial)] hover:border-ink-900 hover:text-ink-900"
                aria-label="Close modal"
              >
                <span className="font-mono text-xs uppercase tracking-[0.04em]">
                  Close
                </span>
                <ShortcutBadge keys={["Esc"]} density="inline" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
