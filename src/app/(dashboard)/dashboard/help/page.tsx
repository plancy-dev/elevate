import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Mail, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.help");
  return { title: t("metaTitle") };
}

export default async function HelpPage() {
  const t = await getTranslations("Dashboard.help");

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex h-12 items-center border-b border-border-subtle bg-background px-[var(--elevate-app-gutter-x)]">
        <h1 className="text-[length:var(--elevate-marketing-lead-size)] font-medium text-text-primary">
          {t("title")}
        </h1>
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-[var(--elevate-app-gutter-x)] pb-10 pt-4 sm:space-y-4 sm:pt-6">
        <Link
          href="https://docs.elevate.example"
          className="flex items-center gap-3 rounded-lg border border-border-subtle bg-layer-01 p-4 transition-colors hover:bg-layer-02"
        >
          <BookOpen className="h-5 w-5 shrink-0 text-text-tertiary" aria-hidden />
          <div className="min-w-0">
            <div className="text-[length:var(--elevate-marketing-lead-size)] font-medium text-text-primary">
              {t("documentation")}
            </div>
            <div className="mt-0.5 text-[length:var(--elevate-prose-body-size)] leading-snug text-text-tertiary">
              {t("documentationSub")}
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-layer-01 p-4">
          <Mail className="h-5 w-5 shrink-0 text-text-tertiary" aria-hidden />
          <div className="min-w-0">
            <div className="text-[length:var(--elevate-marketing-lead-size)] font-medium text-text-primary">
              {t("emailLabel")}
            </div>
            <div className="mt-0.5 text-[length:var(--elevate-prose-body-size)] leading-snug text-text-tertiary">
              support@elevate.example
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-layer-01 p-4">
          <MessageCircle className="h-5 w-5 shrink-0 text-text-tertiary" aria-hidden />
          <div className="min-w-0">
            <div className="text-[length:var(--elevate-marketing-lead-size)] font-medium text-text-primary">
              {t("chat")}
            </div>
            <div className="mt-0.5 text-[length:var(--elevate-prose-body-size)] leading-snug text-text-tertiary">
              {t("chatSub")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
