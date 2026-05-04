"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  getPosthogPublicConfig,
  isPosthogBrowserDebugEnabled,
} from "@/lib/env/posthog-public";
import { PostHogProvider } from "./posthog-provider";

type PublicConfig = NonNullable<ReturnType<typeof getPosthogPublicConfig>>;

export type PostHogRootProps = {
  children: ReactNode;
  /**
   * Snapshot from the root Server Component (`getPosthogPublicConfig()` there).
   * Works around Turbopack/client bundles where `process.env.NEXT_PUBLIC_*` may not match Node at build time.
   */
  initialPublicConfig?: PublicConfig | null;
  /**
   * When true, logs a one-line diagnostic to the browser console (key length + prefix only).
   * Prefer `NEXT_PUBLIC_POSTHOG_DEBUG` via root layout; this prop overrides when set.
   */
  debug?: boolean;
};

const DEFAULT_INGEST = "https://us.i.posthog.com";

function resolveConfig(
  initialPublicConfig: PublicConfig | null | undefined,
): {
  config: PublicConfig | null;
  source: "server_layout" | "client_env" | "none";
} {
  const key = initialPublicConfig?.apiKey?.trim();
  if (key && initialPublicConfig) {
    return {
      config: {
        apiKey: key,
        apiHost:
          initialPublicConfig.apiHost?.trim() || DEFAULT_INGEST,
      },
      source: "server_layout",
    };
  }
  const fromClient = getPosthogPublicConfig();
  if (fromClient) {
    return { config: fromClient, source: "client_env" };
  }
  return { config: null, source: "none" };
}

export function PostHogRoot({
  children,
  initialPublicConfig = null,
  debug,
}: PostHogRootProps) {
  const { config, source } = resolveConfig(initialPublicConfig);
  const effectiveDebug = debug ?? isPosthogBrowserDebugEnabled();

  useEffect(() => {
    if (!effectiveDebug) return;
    if (config) {
      const k = config.apiKey;
      console.info("[elevate:posthog]", {
        provider: "mounting",
        configSource: source,
        apiHost: config.apiHost,
        keyLength: k.length,
        keyPrefix: k.slice(0, 4),
      });
    } else {
      console.info("[elevate:posthog]", {
        provider: "skipped",
        configSource: source,
        reason: "no_project_token",
      });
    }
  }, [config, effectiveDebug, source]);

  if (!config) return children;
  return (
    <PostHogProvider
      apiKey={config.apiKey}
      apiHost={config.apiHost}
      debug={effectiveDebug}
    >
      {children}
    </PostHogProvider>
  );
}
