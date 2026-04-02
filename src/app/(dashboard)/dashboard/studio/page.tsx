import type { Metadata } from "next";
import { Sparkles, BookOpen, CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.studio");
  return { title: t("metaTitle") };
}

export default async function StudioPage() {
  const t = await getTranslations("Dashboard.studio");
  const bullets = [t("bullet1"), t("bullet2"), t("bullet3")];

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            {t("metaTitle")}
          </h1>
          <Badge variant="warm-gray">{t("badge")}</Badge>
        </div>
        <p className="mt-2 text-sm text-text-tertiary leading-relaxed max-w-2xl">
          {t("intro")}
        </p>
        <ul className="mt-4 space-y-2 text-sm text-text-secondary list-disc pl-5 max-w-2xl">
          {bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <Card className="border-border-subtle mb-8">
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center border border-dashed border-border-subtle rounded-none bg-layer-02/50">
          <Sparkles className="h-10 w-10 text-primary mb-4" aria-hidden />
          <p className="text-sm font-medium text-text-primary">{t("building")}</p>
          <p className="mt-2 text-xs text-text-tertiary max-w-md leading-relaxed">
            {t("note")}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <ButtonLink href="/dashboard/library" variant="primary" size="lg">
          <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
          {t("ctaLibrary")}
        </ButtonLink>
        <ButtonLink href="/dashboard/billing" variant="tertiary" size="lg">
          <CreditCard className="h-4 w-4 shrink-0" aria-hidden />
          {t("ctaBilling")}
        </ButtonLink>
      </div>
    </div>
  );
}
