"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import "sonner/dist/styles.css";

/** Sonner host for dashboard — keeps toasts above the main column without blocking the sidebar. */
export function AppToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      richColors
      closeButton
      toastOptions={{ duration: 4500 }}
    />
  );
}
