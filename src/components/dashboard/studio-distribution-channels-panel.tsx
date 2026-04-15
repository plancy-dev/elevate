"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import {
  createStudioDistributionChannel,
  deleteStudioDistributionChannel,
  type StudioChannelActionState,
} from "@/actions/studio-distribution-channels";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import { toast } from "@/lib/ui/app-toast";
import type { StudioDistributionChannelRow } from "@/lib/studio-productions/shorts-catalog";
import { Button } from "@/components/ui/button";
import { StudioChannelPlatformSelect } from "@/components/dashboard/studio-episode-shorts-fields";

const initialState: StudioChannelActionState = undefined;

export function StudioDistributionChannelsPanel({
  channels,
}: {
  channels: StudioDistributionChannelRow[];
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const [createState, createAction, createPending] = useActionState(
    createStudioDistributionChannel,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStudioDistributionChannel,
    initialState,
  );
  const prevCreate = useRef(false);
  const prevDelete = useRef(false);

  useEffect(() => {
    const done =
      prevCreate.current && !createPending && createState?.success === "created";
    prevCreate.current = createPending;
    if (done) toast.success(t("channelsToastCreated"));
  }, [createPending, createState?.success, t]);

  useEffect(() => {
    const done =
      prevDelete.current && !deletePending && deleteState?.success === "deleted";
    prevDelete.current = deletePending;
    if (done) toast.success(t("channelsToastDeleted"));
  }, [deletePending, deleteState?.success, t]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-border-subtle/90 bg-layer-01 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text-primary">{t("channelsAddTitle")}</h2>
        <p className="mt-1 text-sm text-text-tertiary">{t("channelsAddSubtitle")}</p>
        <form action={createAction} className="mt-6 space-y-4 max-w-xl">
          {createState?.error ? (
            <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
              {translateActionErrorMessage(createState.error, tAction)}
            </p>
          ) : null}
          <div>
            <label htmlFor="ch_label" className="block text-xs font-medium text-text-secondary mb-1">
              {t("channelsFieldLabel")}
            </label>
            <input
              id="ch_label"
              name="label"
              required
              maxLength={200}
              placeholder={t("channelsFieldLabelPlaceholder")}
              className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
            />
          </div>
          <div>
            <label htmlFor="ch_url" className="block text-xs font-medium text-text-secondary mb-1">
              {t("channelsFieldUrl")}
            </label>
            <input
              id="ch_url"
              name="channel_url"
              type="url"
              required
              placeholder="https://www.youtube.com/@…"
              className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
            />
          </div>
          <div>
            <label htmlFor="ch_platform" className="block text-xs font-medium text-text-secondary mb-1">
              {t("channelsFieldPlatform")}
            </label>
            <StudioChannelPlatformSelect id="ch_platform" />
          </div>
          <div>
            <label htmlFor="ch_notes" className="block text-xs font-medium text-text-secondary mb-1">
              {t("channelsFieldNotes")}
            </label>
            <textarea
              id="ch_notes"
              name="notes"
              rows={2}
              maxLength={4000}
              className="w-full rounded-lg border border-border-subtle bg-field px-3 py-2 text-sm text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
            />
          </div>
          <Button type="submit" variant="primary" isLoading={createPending}>
            {t("channelsAddSubmit")}
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-2">{t("channelsListTitle")}</h2>
        {deleteState?.error ? (
          <p className="mb-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {translateActionErrorMessage(deleteState.error, tAction)}
          </p>
        ) : null}
        {channels.length === 0 ? (
          <p className="text-sm text-text-secondary">{t("channelsListEmpty")}</p>
        ) : (
          <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-layer-02/30">
            {channels.map((ch) => (
              <li
                key={ch.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">{ch.label}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">{ch.platform}</p>
                  {ch.notes ? (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{ch.notes}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href={ch.channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-layer-01 px-3 py-2 text-sm font-medium text-primary hover:bg-layer-02"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    {t("channelsOpen")}
                  </a>
                  <form action={deleteAction}>
                    <input type="hidden" name="channel_id" value={ch.id} />
                    <Button
                      type="submit"
                      variant="danger"
                      size="sm"
                      isLoading={deletePending}
                      onClick={(e) => {
                        if (!window.confirm(t("channelsDeleteConfirm"))) {
                          e.preventDefault();
                        }
                      }}
                    >
                      {t("channelsDelete")}
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
