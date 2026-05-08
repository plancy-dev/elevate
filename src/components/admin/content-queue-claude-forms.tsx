"use client";

import { usePostHog } from "posthog-js/react";
import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  applyClaudeContentRevision,
  type ClaudeQueueActionState,
  requestClaudeContentReview,
  runClaudeReviewThenRevision,
} from "@/actions/admin-content-ops";
import { PostHogEvent } from "@/lib/analytics/posthog-events";

const initialState: ClaudeQueueActionState = { status: "idle" };

type QueueT = ReturnType<typeof useTranslations<"Dashboard.adminContentQueue">>;

function claudeErrorText(t: QueueT, code: string): string {
  switch (code) {
    case "forbidden":
      return t("claude.errors.forbidden");
    case "invalid_id":
      return t("claude.errors.invalid_id");
    case "missing_api_key":
      return t("claude.errors.missing_api_key");
    case "not_found":
      return t("claude.errors.not_found");
    case "anthropic_http":
      return t("claude.errors.anthropic_http");
    case "empty_response":
      return t("claude.errors.empty_response");
    case "no_brief":
      return t("claude.errors.no_brief");
    case "db_error":
      return t("claude.errors.db_error");
    case "exception":
      return t("claude.errors.exception");
    case "revision_failed_after_review":
      return t("claude.errors.revision_failed_after_review");
    default:
      return t("claude.errors.unknown", { code });
  }
}

function formatStateMessage(t: QueueT, s: ClaudeQueueActionState): {
  text: string;
  tone: "ok" | "err" | "muted";
} {
  if (s.status === "idle") return { text: "", tone: "muted" };
  if (s.status === "success") {
    const extra = s.truncation ? ` ${t("claude.truncationWarning")}` : "";
    const body =
      s.code === "review_saved"
        ? t("claude.successReview")
        : s.code === "revision_applied"
          ? t("claude.successRevision")
          : t("claude.successChain");
    return { text: body + extra, tone: "ok" };
  }
  if (s.status === "error") {
    const detail = s.detail ? `: ${s.detail.slice(0, 280)}` : "";
    return { text: `${claudeErrorText(t, s.code)}${detail}`, tone: "err" };
  }
  return { text: "", tone: "muted" };
}

function statusToneClass(tone: "ok" | "err" | "muted") {
  if (tone === "ok") return "text-[11px] text-emerald-800";
  if (tone === "err") return "text-[11px] text-danger";
  return "text-[11px] text-ink-500";
}

function StatusLine({ msg }: { msg: ReturnType<typeof formatStateMessage> }) {
  if (!msg.text) return null;
  return (
    <p role="status" className={statusToneClass(msg.tone)}>
      {msg.text}
    </p>
  );
}

const btnClass =
  "border border-ink-100 bg-paper-0 px-2 py-1 text-[11px] font-medium text-ink-800 hover:bg-highlight";

function ClaudeStepForms({
  itemId,
  t,
  reviewState,
  reviewAction,
  applyState,
  applyAction,
}: {
  itemId: string;
  t: QueueT;
  reviewState: ClaudeQueueActionState;
  reviewAction: (payload: FormData) => void;
  applyState: ClaudeQueueActionState;
  applyAction: (payload: FormData) => void;
}) {
  return (
    <>
      <form action={reviewAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={itemId} />
        <button type="submit" className={btnClass}>
          {t("claude.requestReview")}
        </button>
      </form>
      <StatusLine msg={formatStateMessage(t, reviewState)} />

      <form action={applyAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={itemId} />
        <button type="submit" className={btnClass}>
          {t("claude.applyRevision")}
        </button>
      </form>
      <StatusLine msg={formatStateMessage(t, applyState)} />
    </>
  );
}

export function ContentQueueClaudeForms({
  itemId,
  gatePassed,
  claudeWhenGatePassedEnabled,
}: {
  itemId: string;
  gatePassed: boolean | null;
  claudeWhenGatePassedEnabled: boolean;
}) {
  const t = useTranslations("Dashboard.adminContentQueue");
  const posthog = usePostHog();
  const [reviewState, reviewAction] = useActionState(
    requestClaudeContentReview,
    initialState,
  );
  const [applyState, applyAction] = useActionState(
    applyClaudeContentRevision,
    initialState,
  );
  const [chainState, chainAction] = useActionState(
    runClaudeReviewThenRevision,
    initialState,
  );

  const chainSeqRef = useRef(0);
  const lastReportedOutcomeSeqRef = useRef(0);

  useEffect(() => {
    const seq = chainSeqRef.current;
    if (seq === 0 || chainState.status === "idle") return;
    if (lastReportedOutcomeSeqRef.current === seq) return;

    if (chainState.status === "success" && chainState.code === "chain_complete") {
      posthog?.capture(PostHogEvent.CONTENT_QUEUE_CLAUDE_CHAIN_COMPLETED, {
        content_item_id: itemId,
        gate_passed: gatePassed,
        chain_seq: seq,
        truncation: chainState.truncation ?? false,
      });
      lastReportedOutcomeSeqRef.current = seq;
      return;
    }
    if (chainState.status === "error") {
      posthog?.capture(PostHogEvent.CONTENT_QUEUE_CLAUDE_CHAIN_FAILED, {
        content_item_id: itemId,
        gate_passed: gatePassed,
        chain_seq: seq,
        fail_code: chainState.code,
      });
      lastReportedOutcomeSeqRef.current = seq;
    }
  }, [chainState, gatePassed, itemId, posthog]);

  const isAdvanced = gatePassed === true;
  const shell = "flex flex-col gap-2 border border-dashed border-ink-200 bg-paper-50/80 p-2";

  if (gatePassed === true && !claudeWhenGatePassedEnabled) {
    return (
      <div className={shell}>
        <p className="text-[10px] leading-snug text-ink-500">{t("claude.advancedDisabledByPolicy")}</p>
      </div>
    );
  }

  if (isAdvanced) {
    return (
      <div className={shell}>
        <details className="rounded border border-ink-100/80 bg-paper-0/50 p-1">
          <summary className="cursor-pointer text-center text-[11px] text-ink-700 md:text-left">
            {t("claude.advancedDisclosureLabel")}
          </summary>
          <div className="mt-2 flex flex-col gap-2 border-t border-ink-100/60 pt-2">
            <p className="text-[10px] leading-snug text-ink-600">{t("claude.advancedHintWhenGatePassed")}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-500">
              {t("claude.sectionTitle")}
            </p>
            <ClaudeStepForms
              itemId={itemId}
              t={t}
              reviewState={reviewState}
              reviewAction={reviewAction}
              applyState={applyState}
              applyAction={applyAction}
            />
            <p className="text-[10px] leading-snug text-ink-500">{t("claude.twoStepHint")}</p>
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className={shell}>
      <p className="text-[10px] leading-snug text-ink-600">{t("claude.primaryHint")}</p>
      <form action={chainAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={itemId} />
        <button
          type="submit"
          className={btnClass}
          onClick={() => {
            chainSeqRef.current += 1;
            posthog?.capture(PostHogEvent.CONTENT_QUEUE_CLAUDE_CHAIN_STARTED, {
              content_item_id: itemId,
              gate_passed: gatePassed,
              chain_seq: chainSeqRef.current,
            });
          }}
        >
          {t("claude.primaryChainCta")}
        </button>
      </form>
      <StatusLine msg={formatStateMessage(t, chainState)} />

      <details className="rounded border border-ink-100/80 bg-paper-0/50 p-1">
        <summary className="cursor-pointer text-center text-[11px] text-ink-700 md:text-left">
          {t("claude.primaryStepsDetails")}
        </summary>
        <div className="mt-2 flex flex-col gap-2 border-t border-ink-100/60 pt-2">
          <ClaudeStepForms
            itemId={itemId}
            t={t}
            reviewState={reviewState}
            reviewAction={reviewAction}
            applyState={applyState}
            applyAction={applyAction}
          />
          <p className="text-[10px] leading-snug text-ink-500">{t("claude.twoStepHint")}</p>
        </div>
      </details>
    </div>
  );
}
