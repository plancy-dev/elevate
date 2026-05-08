"use client";

import {
  getAdminContentItem,
  recomputeAdminContentItemReviewGate,
  saveAdminContentItemDraft,
  updateContentItemStatus,
  type AdminContentItemDetail,
} from "@/actions/admin-content-ops";
import { ContentQueueClaudeForms } from "@/components/admin/content-queue-claude-forms";
import { Button } from "@/components/ui/button";
import {
  gatePassedPropForClaudeForms,
  readClaudeReviewBriefMarkdown,
  readLatestReviewGate,
} from "@/lib/admin/content-queue-metadata";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
type Layout = "page" | "dialog";

export function ContentQueueEditorBody({
  row,
  onRowUpdated,
  layout,
  claudeWhenGatePassedEnabled,
  className,
}: {
  row: AdminContentItemDetail;
  onRowUpdated: (next: AdminContentItemDetail) => void;
  layout: Layout;
  claudeWhenGatePassedEnabled: boolean;
  className?: string;
}) {
  const t = useTranslations("Dashboard.adminContentQueue");
  const te = useTranslations("Dashboard.adminContentQueue.editor");

  const gate = readLatestReviewGate(row.metadata);
  const claudeBrief = readClaudeReviewBriefMarkdown(row.metadata);

  const bump = async (formData: FormData) => {
    const id = String(formData.get("id") ?? "").trim();
    const r = await getAdminContentItem(id);
    if (r.ok) onRowUpdated(r.row);
  };

  const saveThenBump = async (formData: FormData) => {
    await saveAdminContentItemDraft(formData);
    await bump(formData);
  };

  const recomputeThenBump = async (formData: FormData) => {
    await recomputeAdminContentItemReviewGate(formData);
    await bump(formData);
  };

  const statusThenBump = async (formData: FormData) => {
    await updateContentItemStatus(formData);
    const id = String(formData.get("id") ?? "").trim();
    const r = await getAdminContentItem(id);
    if (r.ok) onRowUpdated(r.row);
  };

  const bodyRows = layout === "dialog" ? 12 : 22;
  const summaryRows = layout === "dialog" ? 2 : 3;
  const notesRows = layout === "dialog" ? 3 : 4;
  const pad = layout === "dialog" ? "p-3" : "p-4";

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn("grid gap-2 border border-ink-100 bg-paper-0 text-xs text-ink-700 md:grid-cols-2", pad)}>
        <div className="text-center md:text-left">
          <span className="text-ink-500">{te("idLabel")}</span>{" "}
          <code className="text-[11px]">{row.id}</code>
        </div>
        <div className="text-center md:text-left">
          <span className="text-ink-500">{te("statusLabel")}</span>{" "}
          {toItemStatusLabel(t, row.status)}
        </div>
        <div className="text-center md:text-left">
          <span className="text-ink-500">{t("columns.type")}</span>{" "}
          {row.type === "blog" ? t("type.blog") : t("type.newsletter")}
        </div>
        <div className="text-center md:text-left">
          <span className="text-ink-500">{te("localeLabel")}</span> {row.locale}
        </div>
      </div>

      {gate ? (
        <div className={cn("border border-ink-100 bg-paper-0", pad)}>
          <p className="text-center text-xs font-medium text-ink-700 md:text-left">{t("columns.gate")}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1 md:justify-start">
            {gate.passed ? (
              <span className="inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                {t("gate.pass")}
              </span>
            ) : (
              gate.reasons.map((reason) => (
                <span
                  key={reason}
                  className="inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                >
                  {reason}
                </span>
              ))
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-500 md:text-left">
            {te("qualityScore")}: {gate.qualityScore}
          </p>
        </div>
      ) : null}

      <form
        action={saveThenBump}
        className={cn("space-y-4 border border-ink-100 bg-paper-0", pad)}
        key={`draft-${row.id}-${row.updated_at}`}
      >
        <input type="hidden" name="id" value={row.id} />
        <div className="space-y-1">
          <label htmlFor={`cq-title-${row.id}`} className="text-xs font-medium text-ink-700">
            {te("titleLabel")}
          </label>
          <input
            id={`cq-title-${row.id}`}
            name="title"
            defaultValue={row.title}
            required
            className="w-full border border-ink-100 bg-paper-50 px-3 py-2 text-sm text-ink-900"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`cq-summary-${row.id}`} className="text-xs font-medium text-ink-700">
            {te("summaryLabel")}
          </label>
          <textarea
            id={`cq-summary-${row.id}`}
            name="summary"
            rows={summaryRows}
            defaultValue={row.summary ?? ""}
            className="w-full resize-y border border-ink-100 bg-paper-50 px-3 py-2 text-sm text-ink-900"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`cq-body-${row.id}`} className="text-xs font-medium text-ink-700">
            {te("bodyLabel")}
          </label>
          <textarea
            id={`cq-body-${row.id}`}
            name="body_markdown"
            rows={bodyRows}
            defaultValue={row.body_markdown}
            className="w-full resize-y border border-ink-100 bg-paper-50 px-3 py-2 font-mono text-[13px] leading-relaxed text-ink-900"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`cq-notes-${row.id}`} className="text-xs font-medium text-ink-700">
            {te("notesLabel")}
          </label>
          <p className="text-[11px] text-ink-500">{te("notesHint")}</p>
          <textarea
            id={`cq-notes-${row.id}`}
            name="review_notes"
            rows={notesRows}
            defaultValue={row.review_notes ?? ""}
            placeholder={te("notesPlaceholder")}
            className="w-full resize-y border border-ink-100 bg-paper-50 px-3 py-2 text-sm text-ink-900"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          <Button type="submit" variant="primary" size="sm">
            {te("save")}
          </Button>
        </div>
      </form>

      <form
        action={recomputeThenBump}
        className={cn("space-y-2 border border-ink-100 bg-paper-0", pad)}
        key={`gate-${row.id}-${row.updated_at}`}
      >
        <input type="hidden" name="id" value={row.id} />
        <p className="text-center text-xs text-ink-600 md:text-left">{te("gateHint")}</p>
        <div className="flex justify-center md:justify-start">
          <Button type="submit" variant="secondary" size="sm">
            {te("recomputeGate")}
          </Button>
        </div>
      </form>

      <div className={cn("space-y-3 border border-ink-100 bg-paper-0", pad)}>
        <p className="text-center text-xs font-medium text-ink-700 md:text-left">{t("claude.briefHeading")}</p>
        {claudeBrief ? (
          <details className="rounded border border-ink-100 bg-paper-50 p-2">
            <summary className="cursor-pointer text-center text-[11px] text-ink-700 md:text-left">Markdown</summary>
            <pre className="mt-2 max-h-[min(40vh,360px)] overflow-auto whitespace-pre-wrap wrap-break-word text-left text-[11px] text-ink-800">
              {claudeBrief}
            </pre>
          </details>
        ) : (
          <p className="text-center text-[11px] text-ink-500 md:text-left">{t("claude.briefEmpty")}</p>
        )}
        <ContentQueueClaudeForms
          itemId={row.id}
          gatePassed={gatePassedPropForClaudeForms(row.metadata)}
          claudeWhenGatePassedEnabled={claudeWhenGatePassedEnabled}
        />
      </div>

      <div className={cn("border border-ink-100 bg-paper-0", pad)}>
        <p className="mb-2 text-center text-xs font-medium text-ink-700 md:text-left">{te("workflowActions")}</p>
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          <form action={statusThenBump} className="inline-flex">
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="status" value="approved" />
            <Button type="submit" variant="tertiary" size="sm">
              {t("actions.approve")}
            </Button>
          </form>
          <form action={statusThenBump} className="inline-flex">
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="status" value="review_required" />
            <Button type="submit" variant="tertiary" size="sm">
              {t("actions.requestChanges")}
            </Button>
          </form>
          <form action={statusThenBump} className="inline-flex">
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="status" value="scheduled" />
            <Button type="submit" variant="tertiary" size="sm">
              {t("actions.schedule")}
            </Button>
          </form>
          <form action={statusThenBump} className="inline-flex">
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="status" value="publishing" />
            <Button type="submit" variant="tertiary" size="sm">
              {t("actions.publishNow")}
            </Button>
          </form>
          <form action={statusThenBump} className="inline-flex">
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="status" value="rejected" />
            <Button type="submit" variant="danger" size="sm">
              {te("reject")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function toItemStatusLabel(t: (key: string) => string, status: string) {
  if (status === "draft") return t("status.draft");
  if (status === "review_required") return t("status.reviewRequired");
  if (status === "approved") return t("status.approved");
  if (status === "rejected") return t("status.rejected");
  if (status === "scheduled") return t("status.scheduled");
  if (status === "publishing") return t("status.publishing");
  if (status === "published") return t("status.published");
  if (status === "send_failed") return t("status.sendFailed");
  return status;
}
