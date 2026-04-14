import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getStudioIntegrationsPageData } from "@/actions/studio-org-integrations";
import { StudioIntegrationsProviderTabs } from "@/components/dashboard/studio-integrations-provider-tabs";
import {
  isStudioIntegrationsEncryptionConfigured,
  readStudioIntegrationsServerEnabled,
  readStudioIntegrationsUiFlag,
} from "@/lib/studio-integrations";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.productions");
  return { title: t("integrationsMetaTitle") };
}

export default async function ProductionsIntegrationsPage() {
  const t = await getTranslations("Dashboard.productions");
  const uiPreview = readStudioIntegrationsUiFlag();
  const serverCalls = readStudioIntegrationsServerEnabled();
  const encryptionConfigured = isStudioIntegrationsEncryptionConfigured();

  const { organizationId, canEdit, connections } =
    await getStudioIntegrationsPageData();
  return (
    <div className="mx-auto w-full max-w-3xl p-6 lg:p-8">
      <div className="mb-6">
        <Link
          href="/dashboard/productions"
          className="text-sm font-medium text-interactive hover:underline"
        >
          {t("backToList")}
        </Link>
      </div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {t("integrationsTitle")}
        </h1>
        <p className="mt-3 text-sm text-text-tertiary leading-relaxed">
          {t("integrationsIntro")}
        </p>
      </header>

      {!organizationId ? (
        <p className="rounded-xl border border-border-subtle bg-layer-01 p-5 text-sm text-text-secondary shadow-card">
          {t("integrationsNoOrganization")}
        </p>
      ) : (
        <div className="space-y-8">
          <StudioIntegrationsProviderTabs
            connections={connections}
            canEdit={canEdit}
            encryptionConfigured={encryptionConfigured}
            serverCallsEnabled={serverCalls}
          />

          <section className="rounded-xl border border-border-subtle bg-layer-01 p-5 shadow-card space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">
              {t("integrationsPhase0Title")}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {t("integrationsPhase0Body")}
            </p>
            <dl className="grid gap-2 text-xs text-text-tertiary sm:grid-cols-2">
              <div>
                <dt className="font-medium text-text-secondary">
                  {t("integrationsFlagUi")}
                </dt>
                <dd>{uiPreview ? t("integrationsFlagOn") : t("integrationsFlagOff")}</dd>
              </div>
              <div>
                <dt className="font-medium text-text-secondary">
                  {t("integrationsFlagServer")}
                </dt>
                <dd>{serverCalls ? t("integrationsFlagOn") : t("integrationsFlagOff")}</dd>
              </div>
            </dl>
            <p className="text-xs text-text-tertiary leading-relaxed border-t border-border-subtle pt-4">
              {t("integrationsDocHint")}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
