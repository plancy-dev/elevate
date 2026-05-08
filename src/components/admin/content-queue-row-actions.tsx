"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, PanelRight, Send } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  updateContentItemStatus,
  type AdminContentItemRow,
} from "@/actions/admin-content-ops";
import {
  ContentQueueIconTooltip,
  ContentQueueTooltipProvider,
} from "@/components/admin/content-queue-icon-tooltip";
import { ContentQueueClaudeForms } from "@/components/admin/content-queue-claude-forms";
import { Button } from "@/components/ui/button";
import {
  gatePassedPropForClaudeForms,
  readLatestReviewGate,
} from "@/lib/admin/content-queue-metadata";
import { cn } from "@/lib/utils";

type QueueT = ReturnType<typeof useTranslations<"Dashboard.adminContentQueue">>;

function GateBlock({ t, metadata }: { t: QueueT; metadata: AdminContentItemRow["metadata"] }) {
  const latest = readLatestReviewGate(metadata);
  if (!latest) {
    return <span className="text-ink-500">-</span>;
  }
  if (latest.passed) {
    return (
      <span className="inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        {t("gate.pass")}
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {latest.reasons.length === 0 ? (
        <span className="inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          {t("gate.fail")}
        </span>
      ) : (
        latest.reasons.map((reason) => (
          <span
            key={reason}
            className="inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
          >
            {reason}
          </span>
        ))
      )}
    </div>
  );
}

export function ContentQueueRowActions({
  row,
  typeLabel,
  statusLabel,
  claudeWhenGatePassedEnabled,
}: {
  row: AdminContentItemRow;
  typeLabel: string;
  statusLabel: string;
  claudeWhenGatePassedEnabled: boolean;
}) {
  const t = useTranslations("Dashboard.adminContentQueue");
  const createdUtc = new Date(row.created_at).toISOString().replace("T", " ").slice(0, 19);
  const updatedUtc = new Date(row.updated_at).toISOString().replace("T", " ").slice(0, 19);

  const iconBtnClassName = "h-8 w-8 min-w-8 shrink-0 px-0 [&>span]:justify-center";

  return (
    <ContentQueueTooltipProvider>
      <div className="flex flex-nowrap items-center justify-center gap-0.5 sm:gap-1">
        <form action={updateContentItemStatus} className="inline-flex">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="status" value="approved" />
          <ContentQueueIconTooltip label={t("actions.approve")}>
            <Button
              type="submit"
              variant="tertiary"
              size="sm"
              className={iconBtnClassName}
              aria-label={t("actions.approve")}
            >
              <Check className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </Button>
          </ContentQueueIconTooltip>
        </form>
        <form action={updateContentItemStatus} className="inline-flex">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="status" value="publishing" />
          <ContentQueueIconTooltip label={t("actions.publishNow")}>
            <Button
              type="submit"
              variant="tertiary"
              size="sm"
              className={iconBtnClassName}
              aria-label={t("actions.publishNow")}
            >
              <Send className="h-4 w-4" strokeWidth={2} aria-hidden />
            </Button>
          </ContentQueueIconTooltip>
        </form>

        <Dialog.Root>
          <ContentQueueIconTooltip label={t("detailDialog.triggerTooltip")}>
            <Dialog.Trigger asChild>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                className={iconBtnClassName}
                aria-label={t("detailDialog.triggerTooltip")}
              >
                <PanelRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              </Button>
            </Dialog.Trigger>
          </ContentQueueIconTooltip>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 z-85 bg-ink-900/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            )}
          />
          <Dialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-85 max-h-[85vh] w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink-700 bg-paper-50 p-4 text-ink-900 outline-none shadow-lg",
              "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[90vh] max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:border-x-0 max-sm:border-b-0 max-sm:border-t",
            )}
          >
            <div className="mb-3 space-y-1 border-b border-ink-100 pb-3">
              <Dialog.Title className="text-sm font-semibold text-ink-900">
                {t("detailDialog.title")}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                {t("detailDialog.description")}
              </Dialog.Description>
              <p className="wrap-break-word text-xs font-medium text-ink-900">{row.title}</p>
              <p className="text-[11px] text-ink-500">
                {row.locale} · {typeLabel} · {statusLabel}
              </p>
              <Link
                href={`/admin/content-queue/${row.id}`}
                className="inline-block text-[11px] text-vermilion-600 hover:text-vermilion-700 hover:underline"
              >
                {t("actions.openReview")}
              </Link>
            </div>

            <div className="space-y-4 text-xs">
              <section className="space-y-1.5">
                <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  {t("detailDialog.sectionGate")}
                </h3>
                <div className="text-ink-800">
                  <GateBlock t={t} metadata={row.metadata} />
                </div>
              </section>

              <section className="space-y-1.5">
                <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  {t("detailDialog.timingHeading")}
                </h3>
                <ul className="space-y-0.5 text-[11px] text-ink-600">
                  <li>
                    {t("detailDialog.created")}: {createdUtc} UTC
                  </li>
                  <li>
                    {t("detailDialog.updated")}: {updatedUtc} UTC
                  </li>
                </ul>
              </section>

              {row.review_notes ? (
                <section className="space-y-1.5">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                    {t("detailDialog.sectionNotes")}
                  </h3>
                  <p className="max-h-32 overflow-y-auto whitespace-pre-wrap wrap-break-word rounded border border-ink-100 bg-paper-0 p-2 text-[11px] text-ink-700">
                    {row.review_notes}
                  </p>
                </section>
              ) : null}

              <section className="space-y-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  {t("detailDialog.sectionMoreActions")}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <form action={updateContentItemStatus}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="status" value="review_required" />
                    <button
                      type="submit"
                      className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                    >
                      {t("actions.requestChanges")}
                    </button>
                  </form>
                  <form action={updateContentItemStatus}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="status" value="scheduled" />
                    <button
                      type="submit"
                      className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                    >
                      {t("actions.schedule")}
                    </button>
                  </form>
                  <form action={updateContentItemStatus}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="status" value="send_failed" />
                    <button
                      type="submit"
                      className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                    >
                      {t("actions.retryMark")}
                    </button>
                  </form>
                </div>
              </section>

              <section>
                <ContentQueueClaudeForms
                  itemId={row.id}
                  gatePassed={gatePassedPropForClaudeForms(row.metadata)}
                  claudeWhenGatePassedEnabled={claudeWhenGatePassedEnabled}
                />
              </section>
            </div>

            <div className="mt-4 flex justify-end border-t border-ink-100 pt-3">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary" size="sm">
                  {t("detailDialog.close")}
                </Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      </div>
    </ContentQueueTooltipProvider>
  );
}
