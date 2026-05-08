"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  deleteContentProduct,
  uploadContentProduct,
  type UploadContentProductResult,
} from "@/actions/content-products-admin";
import {
  ContentCatalogEditDialog,
  type ContentProductWithLemon,
} from "@/components/admin/content-catalog-edit-dialog";
import { LEMON_CUSTOM_PRICE_MIN_KRW } from "@/lib/payments/lemon-custom-price-minimum";
import { cn } from "@/lib/utils";

const KINDS = ["ebook", "guide", "template", "bundle"] as const;

function formatKrwFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

function uploadErrorMessage(
  t: ReturnType<typeof useTranslations>,
  code: string | undefined,
): string {
  if (!code) return t("errors.unknown");
  switch (code) {
    case "unauthorized":
      return t("errors.unauthorized");
    case "forbidden":
      return t("errors.forbidden");
    case "invalid_slug":
      return t("errors.invalid_slug");
    case "title_required":
      return t("errors.title_required");
    case "file_required":
      return t("errors.file_required");
    case "file_too_large":
      return t("errors.file_too_large");
    case "file_type":
      return t("errors.file_type");
    case "storage_upload_failed":
      return t("errors.storage_upload_failed");
    case "db_insert_failed":
      return t("errors.db_insert_failed");
    case "db_update_failed":
      return t("errors.db_update_failed");
    case "slug_taken":
      return t("errors.slug_taken");
    default:
      return t("errors.unknown");
  }
}

function deleteErrorMessage(
  t: ReturnType<typeof useTranslations>,
  code: string | undefined,
): string {
  if (!code) return t("errors.unknown");
  switch (code) {
    case "unauthorized":
      return t("errors.unauthorized");
    case "forbidden":
      return t("errors.forbidden");
    case "not_found":
      return t("errors.not_found");
    case "invalid_id":
      return t("errors.invalid_id");
    case "db_delete_failed":
      return t("errors.db_delete_failed");
    default:
      return t("errors.unknown");
  }
}

export function ContentProductsAdminClient({
  initialRows,
}: {
  initialRows: ContentProductWithLemon[];
}) {
  const t = useTranslations("Dashboard.adminContent");
  const tKinds = useTranslations("Dashboard.library.productKind");
  const router = useRouter();
  const [editing, setEditing] = useState<ContentProductWithLemon | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadContentProduct,
    undefined as UploadContentProductResult | undefined,
  );

  const onSaved = useCallback(() => {
    router.refresh();
  }, [router]);

  const closeEdit = useCallback(() => {
    setEditing(null);
  }, []);

  useEffect(() => {
    if (uploadState?.ok) {
      router.refresh();
    }
  }, [uploadState?.ok, router]);

  function requestDelete(row: ContentProductWithLemon) {
    setDeleteError(null);
    const ok = window.confirm(t("deleteConfirm", { title: row.title }));
    if (!ok) return;
    startDelete(async () => {
      const r = await deleteContentProduct(row.id);
      if (!r.ok) {
        setDeleteError(deleteErrorMessage(t, r.error));
        return;
      }
      router.refresh();
      if (editing?.id === row.id) {
        setEditing(null);
      }
    });
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="catalog-list-heading">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-3">
          <h2
            id="catalog-list-heading"
            className="text-xs font-semibold uppercase tracking-wider text-ink-500"
          >
            {t("sectionListTitle")}
          </h2>
        </div>
        {deleteError ? (
          <p className="mb-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {deleteError}
          </p>
        ) : null}
        {initialRows.length === 0 ? (
          <p className="text-sm text-ink-700">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-1)] border border-ink-100">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-paper-50 text-ink-700">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("colSlug")}</th>
                  <th className="px-3 py-2 font-medium">{t("colTitle")}</th>
                  <th className="px-3 py-2 font-medium">{t("colKind")}</th>
                  <th className="px-3 py-2 font-medium">{t("colPrice")}</th>
                  <th className="px-3 py-2 font-medium">{t("colActive")}</th>
                  <th className="px-3 py-2 font-medium min-w-[120px]">{t("colStorage")}</th>
                  <th className="px-3 py-2 font-medium text-right w-[1%] whitespace-nowrap">
                    {t("colActions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-ink-100 hover:bg-paper-0"
                  >
                    <td className="px-3 py-2 font-mono text-xs align-middle">{row.slug}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate align-middle" title={row.title}>
                      {row.title}
                    </td>
                    <td className="px-3 py-2 text-ink-700 align-middle">
                      {KINDS.includes(row.product_kind as (typeof KINDS)[number])
                        ? tKinds(row.product_kind as (typeof KINDS)[number])
                        : row.product_kind}
                    </td>
                    <td className="px-3 py-2 tabular-nums align-middle">
                      {formatKrwFromCents(row.price_cents)}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {row.is_active ? t("yes") : t("no")}
                    </td>
                    <td
                      className="px-3 py-2 font-mono text-[11px] text-ink-500 max-w-[180px] truncate align-middle"
                      title={row.storage_object_path ?? ""}
                    >
                      {row.storage_object_path ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-middle text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(row)}
                          className="rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-2.5 py-1 text-xs font-medium text-ink-900 hover:bg-paper-50"
                        >
                          {t("editAction")}
                        </button>
                        <button
                          type="button"
                          disabled={pendingDelete}
                          onClick={() => requestDelete(row)}
                          className="rounded-[var(--radius-1)] border border-red-500/30 bg-red-500/5 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {t("deleteAction")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="catalog-create-heading" className="rounded-[var(--radius-1)] border border-ink-100 bg-paper-0/50 p-5">
        <h2
          id="catalog-create-heading"
          className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-4"
        >
          {t("sectionCreateTitle")}
        </h2>
        <p className="text-sm text-ink-500 mb-4 max-w-xl leading-relaxed">{t("createIntro")}</p>
        <form action={uploadAction} className="max-w-lg space-y-4">
          <div>
            <label htmlFor="cp-slug" className="block text-xs font-medium text-ink-700 mb-1">
              {t("slug")}
            </label>
            <input
              id="cp-slug"
              name="slug"
              type="text"
              required
              className="w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm"
              placeholder="team-alignment-ebook"
              autoComplete="off"
            />
            <p className="mt-1 text-[11px] text-ink-500">{t("slugHint")}</p>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                name="replaceExisting"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-100"
              />
              <span>{t("replaceExisting")}</span>
            </label>
          </div>
          <div>
            <label htmlFor="cp-title" className="block text-xs font-medium text-ink-700 mb-1">
              {t("titleLabel")}
            </label>
            <input
              id="cp-title"
              name="title"
              type="text"
              required
              className="w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="cp-desc" className="block text-xs font-medium text-ink-700 mb-1">
              {t("description")}
            </label>
            <textarea
              id="cp-desc"
              name="description"
              rows={3}
              className="w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="cp-price" className="block text-xs font-medium text-ink-700 mb-1">
              {t("priceKrw")}
            </label>
            <input
              id="cp-price"
              name="priceKrw"
              type="number"
              min={0}
              step={1}
              defaultValue={LEMON_CUSTOM_PRICE_MIN_KRW}
              className="w-full max-w-[200px] rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm tabular-nums"
            />
            <p className="mt-1 text-[11px] text-ink-500 leading-relaxed">
              {t("priceKrwLemonHint", { minKrw: LEMON_CUSTOM_PRICE_MIN_KRW })}
            </p>
          </div>
          <div>
            <label htmlFor="cp-kind" className="block text-xs font-medium text-ink-700 mb-1">
              {t("productKind")}
            </label>
            <select
              id="cp-kind"
              name="productKind"
              defaultValue="ebook"
              className="w-full max-w-xs rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {tKinds(k)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cp-file" className="block text-xs font-medium text-ink-700 mb-1">
              {t("file")}
            </label>
            <input
              id="cp-file"
              name="file"
              type="file"
              required
              accept=".pdf,.epub,.zip,application/pdf,application/epub+zip,application/zip"
              className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-[var(--radius-1)] file:border-0 file:bg-highlight file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary"
            />
            <p className="mt-1 text-[11px] text-ink-500">{t("fileHint")}</p>
          </div>

          {uploadState && !uploadState.ok ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {uploadErrorMessage(t, uploadState.error)}
            </p>
          ) : null}
          {uploadState?.ok ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              {uploadState.replaced ? t("successReplaced") : t("successCreated")}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={uploadPending}
            className={cn(
              "inline-flex items-center justify-center rounded-[var(--radius-1)] px-4 py-2 text-sm font-medium transition-colors",
              uploadPending
                ? "bg-surface-03 text-ink-500 cursor-not-allowed"
                : "bg-primary text-[var(--color-text-on-color)] hover:opacity-90",
            )}
          >
            {uploadPending ? t("pending") : t("submitCreate")}
          </button>
        </form>
      </section>

      <ContentCatalogEditDialog
        row={editing}
        open={editing !== null}
        onClose={closeEdit}
        onSaved={onSaved}
      />
    </div>
  );
}
