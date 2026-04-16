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
        className="flex flex-wrap gap-1 rounded-xl border border-border-subtle bg-layer-02/40 p-1 dark:border-border-subtle dark:bg-layer-02/60"
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
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border border-border-subtle/80 bg-layer-01 text-text-primary shadow-sm"
                  : "text-text-secondary hover:bg-layer-01/60 hover:text-text-primary",
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
