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
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center border-b border-ink-100 bg-paper-50 px-[var(--elevate-app-gutter-x)]">
        <h1 className="text-[length:var(--elevate-marketing-lead-size)] font-medium text-ink-900">
          {t("title")}
        </h1>
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-[var(--elevate-app-gutter-x)] pb-10 pt-4 sm:space-y-4 sm:pt-6">
        <Link
          href="https://docs.elevate.example"
          className="flex items-center gap-3 rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 p-4 transition-colors hover:bg-paper-50"
        >
          <BookOpen className="h-5 w-5 shrink-0 text-ink-500" aria-hidden />
          <div className="min-w-0">
            <div className="text-[length:var(--elevate-marketing-lead-size)] font-medium text-ink-900">
              {t("documentation")}
            </div>
            <div className="mt-0.5 text-[length:var(--elevate-prose-body-size)] leading-snug text-ink-500">
              {t("documentationSub")}
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3 rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 p-4">
          <Mail className="h-5 w-5 shrink-0 text-ink-500" aria-hidden />
          <div className="min-w-0">
            <div className="text-[length:var(--elevate-marketing-lead-size)] font-medium text-ink-900">
              {t("emailLabel")}
            </div>
            <div className="mt-0.5 text-[length:var(--elevate-prose-body-size)] leading-snug text-ink-500">
              support@elevate.example
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 p-4">
          <MessageCircle className="h-5 w-5 shrink-0 text-ink-500" aria-hidden />
          <div className="min-w-0">
            <div className="text-[length:var(--elevate-marketing-lead-size)] font-medium text-ink-900">
              {t("chat")}
            </div>
            <div className="mt-0.5 text-[length:var(--elevate-prose-body-size)] leading-snug text-ink-500">
              {t("chatSub")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
