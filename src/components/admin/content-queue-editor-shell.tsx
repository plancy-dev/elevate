"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type AdminContentItemDetail } from "@/actions/admin-content-ops";
import { ContentQueueEditorBody } from "@/components/admin/content-queue-editor-body";

export function ContentQueueEditorShell({
  initialRow,
  layout,
  claudeWhenGatePassedEnabled,
}: {
  initialRow: AdminContentItemDetail;
  layout: "page" | "dialog";
  claudeWhenGatePassedEnabled: boolean;
}) {
  const [row, setRow] = useState(initialRow);
  const router = useRouter();

  useEffect(() => {
    setRow(initialRow);
  }, [initialRow]);

  return (
    <ContentQueueEditorBody
      row={row}
      layout={layout}
      claudeWhenGatePassedEnabled={claudeWhenGatePassedEnabled}
      onRowUpdated={(next) => {
        setRow(next);
        router.refresh();
      }}
    />
  );
}
