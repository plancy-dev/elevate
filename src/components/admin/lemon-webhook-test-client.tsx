"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export type LemonProductRow = {
  id: string;
  slug: string;
  title: string;
  is_active: boolean;
};

function CopyButton({ text, children }: { text: string; children: ReactNode }) {
  const t = useTranslations("Dashboard.adminLemonWebhook");
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-md border border-border-subtle bg-layer-01 px-2 py-1 text-xs text-text-secondary hover:bg-layer-02 hover:text-text-primary transition-colors"
    >
      {copied ? t("copied") : children}
    </button>
  );
}

export function LemonWebhookTestClient({
  organizationId,
  profileEmail,
  products,
  webhookUrl,
}: {
  organizationId: string | null;
  profileEmail: string | null;
  products: LemonProductRow[];
  webhookUrl: string;
}) {
  const t = useTranslations("Dashboard.adminLemonWebhook");
  const [variantId, setVariantId] = useState("");
  const [slugPick, setSlugPick] = useState(() => products[0]?.slug ?? "");

  const variantEnvLine = useMemo(() => {
    const vid = variantId.trim();
    const slug = slugPick.trim();
    if (!vid || !slug) return "";
    return `LEMON_SQUEEZY_VARIANT_TO_CONTENT_SLUG=${JSON.stringify({ [vid]: slug })}`;
  }, [variantId, slugPick]);

  function customDataJson(slug: string): string {
    if (!organizationId) {
      return JSON.stringify(
        { content_product_slug: slug },
        null,
        2,
      );
    }
    return JSON.stringify(
      {
        organization_id: organizationId,
        content_product_slug: slug,
      },
      null,
      2,
    );
  }

  return (
    <div className="space-y-10">
      <section className="rounded-lg border border-border-subtle bg-layer-01 p-4 shadow-ambient">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          {t("sectionIdentity")}
        </h2>
        {!organizationId ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">{t("noOrg")}</p>
        ) : (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-text-tertiary mb-1">{t("organizationId")}</dt>
              <dd className="flex flex-wrap items-center gap-2 font-mono text-xs text-text-primary break-all">
                {organizationId}
                <CopyButton text={organizationId}>{t("copy")}</CopyButton>
              </dd>
            </div>
            <div>
              <dt className="text-text-tertiary mb-1">{t("profileEmail")}</dt>
              <dd className="flex flex-wrap items-center gap-2 text-text-primary">
                {profileEmail ?? "—"}
                {profileEmail ? (
                  <CopyButton text={profileEmail}>{t("copy")}</CopyButton>
                ) : null}
              </dd>
              <p className="mt-1 text-xs text-text-tertiary">{t("profileEmailHint")}</p>
            </div>
          </dl>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          {t("sectionCatalog")}
        </h2>
        {products.length === 0 ? (
          <p className="text-sm text-text-secondary">{t("emptyCatalog")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-subtle shadow-ambient">
            <table className="w-full text-left text-sm">
              <thead className="bg-layer-02 text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("colSlug")}</th>
                  <th className="px-3 py-2 font-medium">{t("colId")}</th>
                  <th className="px-3 py-2 font-medium">{t("colTitle")}</th>
                  <th className="px-3 py-2 font-medium">{t("colActive")}</th>
                  <th className="px-3 py-2 font-medium min-w-[200px]">
                    {t("colCustomData")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {products.map((p) => (
                  <tr key={p.id} className="bg-background">
                    <td className="px-3 py-2 font-mono text-xs">{p.slug}</td>
                    <td className="px-3 py-2 font-mono text-xs break-all max-w-[200px]">
                      {p.id}
                    </td>
                    <td className="px-3 py-2">{p.title}</td>
                    <td className="px-3 py-2">{p.is_active ? t("yes") : t("no")}</td>
                    <td className="px-3 py-2 align-top">
                      <pre className="text-[11px] leading-snug text-text-secondary whitespace-pre-wrap max-w-md mb-2">
                        {customDataJson(p.slug)}
                      </pre>
                      <CopyButton text={customDataJson(p.slug)}>
                        {t("copyCustomData")}
                      </CopyButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border-subtle bg-layer-01 p-4 shadow-ambient">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
          {t("sectionVariantEnv")}
        </h2>
        <p className="text-sm text-text-secondary mb-4">{t("variantEnvIntro")}</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-tertiary">{t("variantIdLabel")}</span>
            <input
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="rounded-md border border-border-subtle bg-background px-3 py-2 text-sm font-mono"
              placeholder="12345"
              autoComplete="off"
            />
          </label>
          {products.length > 0 ? (
            <label className="flex flex-col gap-1 text-sm min-w-[200px]">
              <span className="text-text-tertiary">{t("slugSelectLabel")}</span>
              <select
                value={slugPick}
                onChange={(e) => setSlugPick(e.target.value)}
                className="rounded-md border border-border-subtle bg-background px-3 py-2 text-sm"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.slug}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        {variantEnvLine ? (
          <div className="space-y-2">
            <pre className="text-[11px] leading-snug p-3 rounded-md bg-layer-02 border border-border-subtle font-mono text-text-primary whitespace-pre-wrap break-all">
              {variantEnvLine}
            </pre>
            <CopyButton text={variantEnvLine}>{t("copyEnv")}</CopyButton>
          </div>
        ) : (
          <p className="text-xs text-text-tertiary">{t("variantEnvPlaceholder")}</p>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
          {t("sectionWebhookUrl")}
        </h2>
        <p className="text-sm text-text-secondary mb-2">{t("webhookUrlHint")}</p>
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-text-primary break-all">
          {webhookUrl}
          <CopyButton text={webhookUrl}>{t("copy")}</CopyButton>
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-border-subtle p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2">
          {t("sectionVerify")}
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-sm text-text-secondary">
          <li>{t("verifyLine1")}</li>
          <li>{t("verifyLine2")}</li>
          <li>{t("verifyLine3")}</li>
        </ul>
      </section>

      <p className="text-xs text-text-tertiary">{t("customDataIntro")}</p>
    </div>
  );
}
