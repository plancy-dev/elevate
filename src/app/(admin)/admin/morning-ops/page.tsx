import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  MorningOpsPlaybookClient,
  type MorningOpsTemplate,
} from "@/components/admin/morning-ops-playbook-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.adminMorningOps");
  return { title: t("metaTitle") };
}

export default async function AdminMorningOpsPage() {
  const t = await getTranslations("Dashboard.adminMorningOps");

  const quickLinks = [
    { href: "/admin/runs", label: t("quickLinks.runs") },
    { href: "/admin/content-quality", label: t("quickLinks.contentQuality") },
    { href: "/admin/content-queue", label: t("quickLinks.contentQueue") },
    { href: "/admin/news-sources", label: t("quickLinks.newsSources") },
    { href: "/admin/subscribers", label: t("quickLinks.subscribers") },
  ];

  const templates: MorningOpsTemplate[] = [
    {
      id: "newsletter",
      title: t("templates.newsletter.title"),
      body: t("templates.newsletter.body"),
    },
    {
      id: "blogPivot",
      title: t("templates.blogPivot.title"),
      body: t("templates.blogPivot.body"),
    },
    {
      id: "incident",
      title: t("templates.incident.title"),
      body: t("templates.incident.body"),
    },
  ];

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-ink-100 bg-paper-50 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <ClipboardList className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h1 className="truncate text-sm font-medium text-ink-900">{t("title")}</h1>
        </div>
        <Link href="/admin" className="text-xs text-vermilion-600 transition-colors hover:text-vermilion-700">
          {t("backToAdmin")}
        </Link>
      </div>

      <div className="max-w-5xl space-y-5 p-6">
        <p className="text-sm leading-relaxed text-ink-700">{t("intro")}</p>

        <section className="space-y-3 border border-ink-100 bg-paper-0 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-700">{t("quickLinks.title")}</h2>
          <div className="grid gap-2 md:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border border-ink-100 bg-paper-50 px-3 py-2 text-xs text-ink-800 transition-colors hover:bg-paper-0 hover:text-ink-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-2 border border-ink-100 bg-paper-0 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-700">{t("morningRoutine.title")}</h2>
          <ol className="space-y-1 text-xs leading-relaxed text-ink-800">
            <li>1. {t("morningRoutine.step1")}</li>
            <li>2. {t("morningRoutine.step2")}</li>
            <li>3. {t("morningRoutine.step3")}</li>
            <li>4. {t("morningRoutine.step4")}</li>
          </ol>
        </section>

        <section className="space-y-2 border border-ink-100 bg-paper-0 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-700">{t("decision.title")}</h2>
          <ul className="space-y-1 text-xs leading-relaxed text-ink-800">
            <li>
              <span className="font-medium text-ink-900">{t("decision.go.title")}:</span> {t("decision.go.desc")}
            </li>
            <li>
              <span className="font-medium text-ink-900">{t("decision.adjust.title")}:</span>{" "}
              {t("decision.adjust.desc")}
            </li>
            <li>
              <span className="font-medium text-ink-900">{t("decision.stop.title")}:</span> {t("decision.stop.desc")}
            </li>
          </ul>
        </section>

        <MorningOpsPlaybookClient
          heading={t("templates.title")}
          templates={templates}
          copyLabel={t("actions.copy")}
          copiedLabel={t("actions.copied")}
        />

        <section className="space-y-2 border border-ink-100 bg-paper-0 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-700">{t("monitoring.title")}</h2>
          <ul className="space-y-1 text-xs leading-relaxed text-ink-800">
            <li>- {t("monitoring.item1")}</li>
            <li>- {t("monitoring.item2")}</li>
            <li>- {t("monitoring.item3")}</li>
            <li>- {t("monitoring.item4")}</li>
          </ul>
        </section>

        <section className="space-y-2 border border-ink-100 bg-paper-0 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-700">{t("emergency.title")}</h2>
          <ul className="space-y-1 text-xs leading-relaxed text-ink-800">
            <li>- {t("emergency.item1")}</li>
            <li>- {t("emergency.item2")}</li>
            <li>- {t("emergency.item3")}</li>
          </ul>
          <div className="space-y-2 pt-2">
            <p className="text-[11px] text-ink-500">{t("emergency.windowsHint")}</p>
            <pre className="whitespace-pre-wrap border border-ink-100 bg-paper-50 p-2 text-[11px] text-ink-800">
              {t("emergency.windowsCommand")}
            </pre>
            <p className="text-[11px] text-ink-500">{t("emergency.macHint")}</p>
            <pre className="whitespace-pre-wrap border border-ink-100 bg-paper-50 p-2 text-[11px] text-ink-800">
              {t("emergency.macCommand")}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}

