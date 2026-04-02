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
      <div className="sticky top-0 z-30 flex items-center border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">{t("title")}</h1>
      </div>

      <div className="p-6 max-w-lg space-y-4">
        <Link
          href="https://docs.elevate.example"
          className="flex items-center gap-3 border border-border-subtle bg-layer-01 p-4 hover:bg-layer-02 transition-colors"
        >
          <BookOpen className="h-5 w-5 text-text-tertiary" aria-hidden />
          <div>
            <div className="text-sm font-medium text-text-primary">
              {t("documentation")}
            </div>
            <div className="text-xs text-text-tertiary">{t("documentationSub")}</div>
          </div>
        </Link>
        <div className="flex items-center gap-3 border border-border-subtle bg-layer-01 p-4">
          <Mail className="h-5 w-5 text-text-tertiary" aria-hidden />
          <div>
            <div className="text-sm font-medium text-text-primary">
              {t("emailLabel")}
            </div>
            <div className="text-xs text-text-tertiary">support@elevate.example</div>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border-subtle bg-layer-01 p-4">
          <MessageCircle className="h-5 w-5 text-text-tertiary" aria-hidden />
          <div>
            <div className="text-sm font-medium text-text-primary">{t("chat")}</div>
            <div className="text-xs text-text-tertiary">{t("chatSub")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
