"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";

const ContentQueueReviewEditDialogLazy = dynamic(
  () =>
    import("@/components/admin/content-queue-review-edit-dialog").then(
      (m) => m.ContentQueueReviewEditDialog,
    ),
  {
    ssr: false,
    loading: () => (
      <span
        className="inline-block min-h-[1.5rem] min-w-[4.5rem] rounded-sm bg-ink-100 align-middle"
        aria-hidden
      />
    ),
  },
);

type Props = {
  itemId: string;
  claudeWhenGatePassedEnabled: boolean;
  trigger: ReactNode;
};

/**
 * Radix Dialog + Tooltip can produce hydration mismatches on `/admin/content-queue`
 * when the tree is pre-rendered from the RSC parent. Load the dialog module client-only.
 */
export function ContentQueueReviewEditDialogDynamic({
  itemId,
  claudeWhenGatePassedEnabled,
  trigger,
}: Props) {
  return (
    <ContentQueueReviewEditDialogLazy
      itemId={itemId}
      claudeWhenGatePassedEnabled={claudeWhenGatePassedEnabled}
      trigger={trigger}
    />
  );
}
