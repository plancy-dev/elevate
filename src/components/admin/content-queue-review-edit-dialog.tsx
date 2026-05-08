"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, FileEdit } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useState } from "react";
import { getAdminContentItem, type AdminContentItemDetail } from "@/actions/admin-content-ops";
import { ContentQueueEditorBody } from "@/components/admin/content-queue-editor-body";
import {
  ContentQueueIconTooltip,
  ContentQueueTooltipProvider,
} from "@/components/admin/content-queue-icon-tooltip";
import { Button, ButtonLink } from "@/components/ui/button";
import { ElevateSpinner } from "@/components/ui/elevate-spinner";
import { cn } from "@/lib/utils";

export function ContentQueueReviewEditDialog({
  itemId,
  trigger,
  claudeWhenGatePassedEnabled,
}: {
  itemId: string;
  trigger: ReactNode;
  claudeWhenGatePassedEnabled: boolean;
}) {
  const te = useTranslations("Dashboard.adminContentQueue.editor");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [row, setRow] = useState<AdminContentItemDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorKey(null);
    setDetailError(null);
    const r = await getAdminContentItem(itemId);
    setLoading(false);
    if (!r.ok) {
      setRow(null);
      setDetailError(r.error);
      setErrorKey(
        r.error === "forbidden" || r.error === "unauthorized"
          ? "forbidden"
          : r.error === "invalid_id"
            ? "invalid_id"
            : r.error === "not_found"
              ? "not_found"
              : "generic",
      );
      return;
    }
    setRow(r.row);
  }, [itemId]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        void load();
      } else {
        setRow(null);
        setErrorKey(null);
        setDetailError(null);
        setLoading(false);
      }
    },
    [load],
  );

  const errorMessage =
    errorKey === "forbidden"
      ? te("loadErrorForbidden")
      : errorKey === "invalid_id"
        ? te("loadErrorInvalidId")
        : errorKey === "not_found"
          ? te("loadErrorNotFound")
          : errorKey
            ? te("loadErrorGeneric", { detail: detailError ?? "" })
            : null;

  return (
    <ContentQueueTooltipProvider>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 z-85 bg-ink-900/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            )}
          />
          <Dialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-85 flex max-h-[min(92vh,56rem)] w-[min(calc(100vw-1.5rem),42rem)] -translate-x-1/2 -translate-y-1/2 flex-col border border-ink-700 bg-paper-50 text-ink-900 shadow-lg outline-none",
              "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[95vh] max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:border-x-0 max-sm:border-b-0 max-sm:border-t",
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink-100 bg-paper-50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileEdit className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <Dialog.Title className="truncate text-sm font-semibold text-ink-900">
                  {te("dialogTitle")}
                </Dialog.Title>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ContentQueueIconTooltip label={te("openFullPage")}>
                  <ButtonLink
                    href={`/admin/content-queue/${itemId}`}
                    variant="tertiary"
                    size="sm"
                    className="h-8 min-w-0 px-2"
                    aria-label={te("openFullPage")}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="sr-only">{te("openFullPage")}</span>
                  </ButtonLink>
                </ContentQueueIconTooltip>
                <Dialog.Close asChild>
                  <Button type="button" variant="secondary" size="sm" className="h-8">
                    {te("dialogClose")}
                  </Button>
                </Dialog.Close>
              </div>
            </div>

            <Dialog.Description className="sr-only">{te("intro")}</Dialog.Description>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {loading ? (
                <div className="flex justify-center py-16">
                  <ElevateSpinner size="md" variant="muted" tempo="calm" />
                </div>
              ) : errorMessage ? (
                <p className="text-center text-sm text-danger">{errorMessage}</p>
              ) : row ? (
                <ContentQueueEditorBody
                  row={row}
                  layout="dialog"
                  claudeWhenGatePassedEnabled={claudeWhenGatePassedEnabled}
                  onRowUpdated={setRow}
                  className="pb-2"
                />
              ) : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ContentQueueTooltipProvider>
  );
}
