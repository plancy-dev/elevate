"use client";

import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { PostHogEvent } from "@/lib/analytics/posthog-events";

type Props = {
  userId: string;
  email: string | null;
  organizationId: string;
  role: string;
};

export function PostHogIdentify({
  userId,
  email,
  organizationId,
  role,
}: Props) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog || !userId) return;
    posthog.identify(userId, {
      email: email ?? undefined,
      organization_id: organizationId,
      role,
    });
    posthog.capture(PostHogEvent.ELEVATE_DASHBOARD_IDENTIFIED, {
      organization_id: organizationId,
      role,
    });
  }, [posthog, userId, email, organizationId, role]);

  return null;
}
