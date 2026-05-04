"use client";

import { PostHogProvider as PHProvider } from "posthog-js/react";
import type { ReactNode } from "react";

type Props = {
  apiKey: string;
  apiHost: string;
  /** Enables posthog-js verbose logging + SDK debug output. */
  debug?: boolean;
  children: ReactNode;
};

export function PostHogProvider({
  apiKey,
  apiHost,
  debug = false,
  children,
}: Props) {
  return (
    <PHProvider
      apiKey={apiKey}
      options={{
        api_host: apiHost,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        debug,
      }}
    >
      {children}
    </PHProvider>
  );
}
