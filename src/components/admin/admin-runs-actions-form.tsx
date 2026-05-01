"use client";

import { useFormStatus } from "react-dom";
import {
  createManualContentRun,
  runAdminContentOpsScenario,
  runRetryFailedPublishOnly,
} from "@/actions/admin-content-ops";
import { FieldSelect } from "@/components/ui/field-select";

type RunTypeOption = {
  value: string;
  label: string;
};

type AdminRunsActionsFormLabels = {
  runTypeLabel: string;
  queueManualRun: string;
  runScenario: string;
  retryFailedOnly: string;
  pendingManualRun: string;
  pendingScenario: string;
  pendingRetryFailedOnly: string;
};

export function AdminRunsActionsForm({
  labels,
  runTypeOptions,
}: {
  labels: AdminRunsActionsFormLabels;
  runTypeOptions: RunTypeOption[];
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 border border-ink-100 bg-paper-0 p-3">
      <form action={createManualContentRun} className="flex flex-wrap items-end gap-2">
        <div className="flex items-center gap-2 pr-3">
          <label htmlFor="run_type" className="shrink-0 text-xs text-ink-500">
            {labels.runTypeLabel}
          </label>
          <FieldSelect
            id="run_type"
            name="run_type"
            defaultValue="ingest"
            variant="boxed"
            controlSize="sm"
            className="min-w-[180px] text-xs"
            options={runTypeOptions}
          />
        </div>
        <PendingSubmitButton
          idleLabel={labels.queueManualRun}
          pendingLabel={labels.pendingManualRun}
          className="border border-ink-100 bg-paper-50 px-3 py-1.5 text-xs text-ink-900 hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-70"
        />
      </form>

      <form action={runAdminContentOpsScenario}>
        <PendingSubmitButton
          idleLabel={labels.runScenario}
          pendingLabel={labels.pendingScenario}
          className="border border-ink-100 bg-vermilion-100/40 px-3 py-1.5 text-xs text-ink-900 hover:bg-vermilion-100 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </form>

      <form action={runRetryFailedPublishOnly}>
        <PendingSubmitButton
          idleLabel={labels.retryFailedOnly}
          pendingLabel={labels.pendingRetryFailedOnly}
          className="border border-ink-100 bg-paper-50 px-3 py-1.5 text-xs text-ink-900 hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-70"
        />
      </form>
    </div>
  );
}

function PendingSubmitButton({
  idleLabel,
  pendingLabel,
  className,
}: {
  idleLabel: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
