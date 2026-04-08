import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSiteUrl } from "@/lib/seo/site-url";
import { Card, CardContent } from "@/components/ui/card";

type Reason = "not_signed_in" | "no_email" | "not_allowlisted";

export async function StudioBetaGated({ reason }: { reason: Reason }) {
  const t = await getTranslations("Dashboard.studio");
  const homeWaitlist = `${getSiteUrl()}/#waitlist`;
  const body =
    reason === "not_allowlisted" ? t("gatedBodyAllowlist") : t("gatedBodyAuth");

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <Card className="border-border-subtle">
        <CardContent className="p-8 space-y-4">
          <h1 className="text-xl font-semibold text-text-primary">{t("gatedTitle")}</h1>
          <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={homeWaitlist}
              className="text-sm font-medium text-interactive hover:underline"
            >
              {t("gatedCtaWaitlist")}
            </Link>
            <Link href="/dashboard/library" className="text-sm text-text-tertiary hover:text-primary">
              {t("ctaLibrary")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
