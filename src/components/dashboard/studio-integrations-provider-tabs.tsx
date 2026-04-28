"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { StudioProviderConnectionPanel } from "@/components/dashboard/studio-provider-connection-panel";
import type { StudioOrgProviderConnectionMeta } from "@/lib/data/studio-org-integrations";
import { cn } from "@/lib/utils";
import {
  STUDIO_INTEGRATION_PROVIDER_IDS,
  type StudioIntegrationProviderId,
} from "@/lib/studio-integrations/types";

function metaFor(
  connections: StudioOrgProviderConnectionMeta[],
  id: StudioIntegrationProviderId,
): StudioOrgProviderConnectionMeta | null {
  return connections.find((c) => c.provider === id) ?? null;
}

function tabLabel(
  t: ReturnType<typeof useTranslations<"Dashboard.productions">>,
  id: StudioIntegrationProviderId,
): string {
  switch (id) {
    case "openai":
      return t("integrationsProvider.openai.shortTitle");
    case "anthropic":
      return t("integrationsProvider.anthropic.shortTitle");
    case "runway":
      return t("integrationsProvider.runway.shortTitle");
    case "youtube_data":
      return t("integrationsProvider.youtube_data.shortTitle");
    case "google_gemini":
      return t("integrationsProvider.google_gemini.shortTitle");
    case "elevenlabs":
      return t("integrationsProvider.elevenlabs.shortTitle");
    case "flux_replicate":
      return t("integrationsProvider.flux_replicate.shortTitle");
    case "flux_fal":
      return t("integrationsProvider.flux_fal.shortTitle");
    case "seedream":
      return t("integrationsProvider.seedream.shortTitle");
    case "buffer":
      return t("integrationsProvider.buffer.shortTitle");
  }
}

export function StudioIntegrationsProviderTabs({
  connections,
  canEdit,
  encryptionConfigured,
  serverCallsEnabled,
}: {
  connections: StudioOrgProviderConnectionMeta[];
  canEdit: boolean;
  encryptionConfigured: boolean;
  serverCallsEnabled: boolean;
}) {
  const [active, setActive] =
    useState<StudioIntegrationProviderId>("openai");
  const baseId = useId();
  const t = useTranslations("Dashboard.productions");

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={t("integrationsTabsAriaLabel")}
        className="flex flex-wrap gap-1 rounded-[var(--radius-1)] border border-ink-100 bg-paper-50/40 p-1 dark:border-ink-100 dark:bg-paper-50/60"
      >
        {STUDIO_INTEGRATION_PROVIDER_IDS.map((id) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(id)}
              className={cn(
                "whitespace-nowrap rounded-[var(--radius-1)] px-3 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border border-ink-100/80 bg-paper-0 text-ink-900"
                  : "text-ink-700 hover:bg-paper-0/60 hover:text-ink-900",
              )}
            >
              {tabLabel(t, id)}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
      >
        <StudioProviderConnectionPanel
          key={active}
          providerId={active}
          connectionMeta={metaFor(connections, active)}
          canEdit={canEdit}
          encryptionConfigured={encryptionConfigured}
          serverCallsEnabled={serverCallsEnabled}
        />
      </div>
    </div>
  );
}
