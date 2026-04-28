"use client";

import { Toaster } from "sonner";
import "sonner/dist/styles.css";

/** Sonner host for dashboard — keeps toasts above the main column without blocking the sidebar. */
export function AppToaster() {
  return (
    <Toaster
      theme="light"
      position="top-center"
      closeButton
      toastOptions={{
        duration: 4500,
        classNames: {
          toast: "rounded-none border border-ink-700 bg-paper-100 text-ink-900",
          title: "font-sans text-sm text-ink-900",
          description: "font-sans text-xs text-ink-700",
          closeButton:
            "border border-ink-300 bg-paper-0 text-ink-700 hover:border-ink-900 hover:text-ink-900",
          error:
            "rounded-none border border-ink-700 border-l-[3px] border-l-vermilion-600 bg-paper-100 text-ink-900",
        },
      }}
    />
  );
}
