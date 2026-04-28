import Link from "next/link";
import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WaitlistAdminClient } from "@/components/admin/waitlist-admin-client";
import {
  getWaitlistEmailSettings,
  listWaitlistSignups,
} from "@/actions/waitlist-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.adminWaitlist");
  return { title: t("metaTitle") };
}

export default async function AdminWaitlistPage() {
  const t = await getTranslations("Dashboard.adminWaitlist");
  const tAdmin = await getTranslations("Dashboard.admin");

  const [listRes, settingsRes] = await Promise.all([
    listWaitlistSignups(),
    getWaitlistEmailSettings(),
  ]);

  const rows = listRes.ok ? listRes.rows : [];
  const bcc = settingsRes.ok ? settingsRes.waitlistBccEmail : null;

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-paper-50 px-6 h-12">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="h-4 w-4 text-primary shrink-0" aria-hidden />
          <h1 className="text-sm font-medium text-ink-900 truncate">{t("title")}</h1>
        </div>
        <Link
          href="/admin"
          className="text-xs text-vermilion-600 hover:text-vermilion-700 transition-colors shrink-0"
        >
          {tAdmin("backToOverview")}
        </Link>
      </div>

      <div className="p-6">
        <p className="text-sm text-ink-700 leading-relaxed mb-6">{t("intro")}</p>
        {!listRes.ok ? (
          <p className="text-xs text-danger mb-4">{listRes.error}</p>
        ) : null}
        {!settingsRes.ok ? (
          <p className="text-xs text-danger mb-4">{settingsRes.error}</p>
        ) : null}
        <WaitlistAdminClient initialRows={rows} initialBcc={bcc} />
      </div>
    </div>
  );
}
