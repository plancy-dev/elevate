"use client";

import type { ReactNode } from "react";
import { getPosthogPublicConfig } from "@/lib/env/posthog-public";
import { PostHogProvider } from "./posthog-provider";

export function PostHogRoot({ children }: { children: ReactNode }) {
  const config = getPosthogPublicConfig();
  if (!config) return children;
  return (
    <PostHogProvider apiKey={config.apiKey} apiHost={config.apiHost}>
      {children}
    </PostHogProvider>
  );
}
