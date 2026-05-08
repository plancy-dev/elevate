import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileEdit } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getAdminContentItem } from "@/actions/admin-content-ops";
import { ContentQueueEditorShell } from "@/components/admin/content-queue-editor-shell";
import { getContentOpsClaudeWhenGatePassedEnabled } from "@/lib/content-ops/claude-ui-policy";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const t = await getTranslations("Dashboard.adminContentQueue.editor");
  const titleBase = t("metaTitle");
  const res = await getAdminContentItem(id);
  if (!res.ok) return { title: titleBase };
  return { title: `${res.row.title.slice(0, 48)} · ${titleBase}` };
}

export default async function AdminContentQueueItemPage(props: PageProps) {
  const { id } = await props.params;
  const te = await getTranslations("Dashboard.adminContentQueue.editor");

  const res = await getAdminContentItem(id);
  if (!res.ok) notFound();

  const row = res.row;

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-ink-100 bg-paper-50 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <FileEdit className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h1 className="truncate text-sm font-medium text-ink-900">{te("metaTitle")}</h1>
        </div>
        <Link
          href="/admin/content-queue"
          className="text-xs text-vermilion-600 transition-colors hover:text-vermilion-700"
        >
          {te("backToQueue")}
        </Link>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <p className="text-sm leading-relaxed text-ink-700">{te("intro")}</p>

        <ContentQueueEditorShell
          initialRow={row}
          layout="page"
          claudeWhenGatePassedEnabled={getContentOpsClaudeWhenGatePassedEnabled()}
        />
      </div>
    </div>
  );
}
