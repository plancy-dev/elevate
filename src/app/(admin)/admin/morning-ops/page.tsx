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
      id: "failureManual",
      title: "실패 클래스별 즉시 조치 매뉴얼 (1페이지)",
      body: [
        "[운영 판단 순서 고정]",
        "1) /admin/morning-ops에서 오늘 판단 프레임 확인",
        "2) /admin/runs에서 실패 클래스 확인",
        "3) /admin/content-quality에서 품질/재작업 추세 확인",
        "",
        "[실패 클래스별 즉시 조치]",
        "A. rss_fetch_error:* / rss_http_* / rss_parse_empty_items",
        "- /admin/news-sources에서 해당 소스 즉시 비활성화",
        "- 테스트/fixture 소스(example.invalid, broken fixture) 재활성화 금지",
        "- 활성 소스 수가 과도하면 상위 신뢰 소스만 유지 후 ingest 재실행",
        "",
        "B. resend_not_configured / resend_from_invalid_format",
        "- RESEND_API_KEY, RESEND_FROM_EMAIL 설정값 확인",
        "- 발송 재시도 전에 설정 누락이 완전히 해소됐는지 확인",
        "",
        "C. resend_sandbox_sender / resend_from_domain_mismatch",
        "- RESEND_FROM_EMAIL이 검증 도메인 기반 주소인지 확인",
        "- 필요 시 RESEND_VERIFIED_DOMAIN을 실제 검증 도메인으로 고정",
        "- sandbox 발신 주소는 운영 발송에서 사용 금지",
        "",
        "D. retry_exhausted",
        "- 즉시 대량 재시도 금지 (publish_retry_failed 소량 배치만 실행)",
        "- 원인 클래스(B/C/A)를 먼저 제거한 뒤 재시도",
        "",
        "E. low_novelty (핵심)",
        "- /admin/content-quality에서 low_novelty 비중 먼저 확인",
        "- pack/prompt에서 비교(vs), 왜 지금(why now), 반례(contrarian) 문맥 강화",
        "- 1사이클(ingest -> draft_generate -> review_gate)만 실행 후 재검증",
        "",
        "[실행 원칙]",
        "- publish_retry_failed는 소량 단위로 반복",
        "- 한 번에 처리하는 대상 수를 줄여 실패 반경 최소화",
        "- 조치 후에는 runs + content-quality 지표로만 go/adjust/stop 재판단",
      ].join("\n"),
    },
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
          <p className="text-[11px] text-ink-500">
            {t("morningRoutine.fixedOrderPrefix")}{" "}
            <code>/admin/morning-ops → /admin/runs → /admin/content-quality</code>{" "}
            {t("morningRoutine.fixedOrderSuffix")}
          </p>
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

