"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { type ReactNode, useId } from "react";
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
  const generatedTitleId = useId();
  const generatedDescriptionId = useId();
  const titleId = titleIdProp ?? generatedTitleId;
  const descriptionId = generatedDescriptionId;
  const normalizedTitle = title.trim() || "Dialog";
  const normalizedDescription = description?.trim() || "Dialog content";
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
            "fixed left-1/2 top-1/2 max-h-[85vh] w-[min(100vw-2rem,56rem)] -translate-x-1/2 -translate-y-1/2 border border-ink-700 bg-paper-50 p-6 text-ink-900 outline-none",
            "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:border-x-0 max-sm:border-b-0 max-sm:border-t max-sm:p-4 max-sm:pb-5",
            "max-sm:data-[state=open]:translate-y-0 max-sm:data-[state=closed]:translate-y-full max-sm:transition-transform max-sm:duration-160 max-sm:ease-(--ease-editorial)",
            sizeClass[size],
            layerClassName,
            className,
          )}
          aria-describedby={descriptionId}
          onEscapeKeyDown={onClose}
          onPointerDownOutside={onClose}
        >
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-ink-100 pb-3">
            <div className="min-w-0 space-y-1">
              <Dialog.Title
                id={titleId}
                className="text-[1.5rem] leading-[1.1] [font-family:var(--font-display)] [font-variation-settings:'opsz'_144]"
              >
                {normalizedTitle}
              </Dialog.Title>
              <Dialog.Description
                id={descriptionId}
                className={cn(
                  "leading-relaxed",
                  description ? "text-sm text-ink-700" : "sr-only",
                )}
              >
                {normalizedDescription}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 border border-ink-300 bg-paper-0 px-2 py-1 text-ink-700 transition-colors duration-80 ease-(--ease-editorial) hover:border-ink-900 hover:text-ink-900"
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
