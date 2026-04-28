"use client";

import { useEffect, useRef } from "react";

type ShortcutSequence = "s" | "t" | "p";

export type UseShortcutOptions = {
  onOpenCommandBar: () => void;
  onToggleToc: () => void;
  onSequenceNavigate: (sequence: ShortcutSequence) => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("[contenteditable='true']")) return true;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

function isDialogFocused(): boolean {
  const activeEl = document.activeElement;
  if (!(activeEl instanceof HTMLElement)) return false;
  const openDialog = activeEl.closest("[role='dialog'][data-state='open']");
  return Boolean(openDialog);
}

export function useShortcut({
  onOpenCommandBar,
  onToggleToc,
  onSequenceNavigate,
}: UseShortcutOptions) {
  const sequenceRef = useRef<{ startedAt: number } | null>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isMeta = event.metaKey || event.ctrlKey;

      if (isMeta && key === "k") {
        event.preventDefault();
        onOpenCommandBar();
        return;
      }

      if (isMeta && (key === "\\" || event.code === "Backslash")) {
        event.preventDefault();
        onToggleToc();
        return;
      }

      if (isEditableTarget(event.target) || isDialogFocused()) return;

      if (key === "g" && !isMeta) {
        sequenceRef.current = { startedAt: Date.now() };
        return;
      }

      const current = sequenceRef.current;
      if (!current) return;

      if (Date.now() - current.startedAt > 750) {
        sequenceRef.current = null;
        return;
      }

      if (key === "s" || key === "t" || key === "p") {
        event.preventDefault();
        onSequenceNavigate(key);
      }
      sequenceRef.current = null;
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenCommandBar, onSequenceNavigate, onToggleToc]);
}
