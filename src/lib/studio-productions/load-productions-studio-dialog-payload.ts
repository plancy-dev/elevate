import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getStudioIntegrationsPageData } from "@/actions/studio-org-integrations";
import type { ProductionsStudioDialogPayload } from "@/components/dashboard/productions-studio-dialog-root";
import { countStudioEpisodesByProjectForOrg } from "@/lib/data/studio-productions";
import { listStudioProjectsForOrg } from "@/lib/data/studio-projects";
import { getAppLocale } from "@/lib/i18n/app-locale";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { listStudioDistributionChannelsForOrg } from "@/lib/studio-productions/shorts-catalog";
import type { Database } from "@/types/database.types";

/** Loads projects/channels/integrations data for `ProductionsStudioDialogProvider` (episode detail, etc.). */
export async function loadProductionsStudioDialogPayload(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ProductionsStudioDialogPayload> {
  const locale = await getAppLocale();
  const [channels, projects, integrationsPage] = await Promise.all([
    listStudioDistributionChannelsForOrg(supabase, organizationId),
    listStudioProjectsForOrg(supabase, organizationId),
    getStudioIntegrationsPageData(),
  ]);

  const countsByProject = await countStudioEpisodesByProjectForOrg(
    supabase,
    organizationId,
    {},
  );

  const integrationsEncryption = isStudioIntegrationsEncryptionConfigured();
  const integrationsServerCalls = readStudioIntegrationsServerEnabled();

  return {
    projects,
    episodeCountsByProjectId: countsByProject,
    locale,
    channels,
    integrations: {
      organizationId: integrationsPage.organizationId,
      canEdit: integrationsPage.canEdit,
      connections: integrationsPage.connections,
      encryptionConfigured: integrationsEncryption,
      serverCallsEnabled: integrationsServerCalls,
      youtubeOAuthEnvConfigured: integrationsPage.youtubeOAuthEnvConfigured,
      youtubeChannelTitle: integrationsPage.youtubeChannelTitle,
    },
  };
}
