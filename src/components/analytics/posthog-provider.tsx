"use client";

import { PostHogProvider as PHProvider } from "posthog-js/react";
import type { ReactNode } from "react";

type Props = {
  apiKey: string;
  apiHost: string;
  children: ReactNode;
};

export function PostHogProvider({ apiKey, apiHost, children }: Props) {
  return (
    <PHProvider
      apiKey={apiKey}
      options={{
        api_host: apiHost,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
      }}
    >
      {children}
    </PHProvider>
  );
}
