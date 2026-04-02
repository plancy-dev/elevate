import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.billing");
  return { title: t("failMeta") };
}

export default async function BillingPaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code : "";
  const message = typeof sp.message === "string" ? sp.message : "";

  const t = await getTranslations("Dashboard.billing");

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-lg font-medium text-text-primary">{t("failTitle")}</h1>
      <p className="text-sm text-text-secondary mt-2 max-w-md">
        {message || t("failBody")}
      </p>
      {code ? (
        <p className="text-xs text-text-tertiary mt-2 font-mono">
          {t("failCode", { code })}
        </p>
      ) : null}
      <Link
        href="/dashboard/billing"
        className="text-sm text-primary mt-6 inline-block hover:underline"
      >
        {t("backToBilling")}
      </Link>
    </div>
  );
}
