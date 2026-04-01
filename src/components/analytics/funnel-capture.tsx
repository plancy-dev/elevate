"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect, useRef } from "react";

type Props = {
  event: string;
  /** Sent once per mount; keep stable (primitives) to avoid double fire. */
  properties?: Record<string, string | number | boolean | null>;
};

/** Fires a single PostHog event when the provider is ready. */
export function FunnelCaptureOnce({ event, properties }: Props) {
  const posthog = usePostHog();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !posthog) return;
    sent.current = true;
    posthog.capture(event, properties ?? {});
    // properties: capture once at mount; omit from deps to avoid object identity churn
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional single fire
  }, [posthog, event]);

  return null;
}
