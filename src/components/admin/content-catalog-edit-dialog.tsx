"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  updateContentProduct,
  type MutateContentProductResult,
} from "@/actions/content-products-admin";
import { ContentProductLemonCell } from "@/components/admin/content-product-lemon-cell";
import { LEMON_CUSTOM_PRICE_MIN_KRW } from "@/lib/payments/lemon-custom-price-minimum";
import type { Database } from "@/types/database.types";
import { cn } from "@/lib/utils";

type ContentProductRow = Database["public"]["Tables"]["content_products"]["Row"];
type LemonLinkRow = Database["public"]["Tables"]["content_product_lemon_links"]["Row"];

export type ContentProductWithLemon = ContentProductRow & {
  lemonLink: LemonLinkRow | null;
};

const KINDS = ["ebook", "guide", "template", "bundle"] as const;

function editErrorMessage(
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
    case "file_too_large":
      return t("errors.file_too_large");
    case "file_type":
      return t("errors.file_type");
    case "storage_upload_failed":
      return t("errors.storage_upload_failed");
    case "db_update_failed":
      return t("errors.db_update_failed");
    case "not_found":
      return t("errors.not_found");
    case "slug_taken_edit":
      return t("errors.slug_taken_edit");
    case "invalid_id":
      return t("errors.invalid_id");
    case "lemon_link_failed":
      return t("errors.lemon_link_failed");
    default:
      return t("errors.unknown");
  }
}

export function ContentCatalogEditDialog({
  row,
  open,
  onClose,
  onSaved,
}: {
  row: ContentProductWithLemon | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("Dashboard.adminContent");
  const tKinds = useTranslations("Dashboard.library.productKind");

  const [state, formAction, pending] = useActionState(
    updateContentProduct,
    undefined as MutateContentProductResult | undefined,
  );

  const saveSucceeded = Boolean(state?.ok);
  useEffect(() => {
    if (!saveSucceeded) return;
    onSaved();
    onClose();
  }, [saveSucceeded, onSaved, onClose]);

  if (!open || !row) {
    return null;
  }

  const priceKrw = Math.round(row.price_cents / 100);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-edit-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <h2 id="catalog-edit-title" className="text-base font-semibold text-ink-900">
            {t("editHeading")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-ink-500 hover:text-ink-900"
          >
            {t("cancel")}
          </button>
        </div>

        <form key={row.id} action={formAction} className="space-y-4">
          <input type="hidden" name="contentProductId" value={row.id} />

          <div>
            <label htmlFor="edit-slug" className="block text-xs font-medium text-ink-700 mb-1">
              {t("slug")}
            </label>
            <input
              id="edit-slug"
              name="slug"
              type="text"
              required
              defaultValue={row.slug}
              className="w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm font-mono"
              autoComplete="off"
            />
            <p className="mt-1 text-[11px] text-ink-500">{t("slugEditHint")}</p>
          </div>

          <div>
            <label htmlFor="edit-title" className="block text-xs font-medium text-ink-700 mb-1">
              {t("titleLabel")}
            </label>
            <input
              id="edit-title"
              name="title"
              type="text"
              required
              defaultValue={row.title}
              className="w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="edit-desc" className="block text-xs font-medium text-ink-700 mb-1">
              {t("description")}
            </label>
            <textarea
              id="edit-desc"
              name="description"
              rows={3}
              defaultValue={row.description}
              className="w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="edit-price" className="block text-xs font-medium text-ink-700 mb-1">
              {t("priceKrw")}
            </label>
            <input
              id="edit-price"
              name="priceKrw"
              type="number"
              min={0}
              step={1}
              defaultValue={priceKrw}
              className="w-full max-w-[200px] rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm tabular-nums"
            />
            <p className="mt-1 text-[11px] text-ink-500 leading-relaxed">
              {t("priceKrwLemonHint", { minKrw: LEMON_CUSTOM_PRICE_MIN_KRW })}
            </p>
          </div>

          <div>
            <label htmlFor="edit-kind" className="block text-xs font-medium text-ink-700 mb-1">
              {t("productKind")}
            </label>
            <select
              id="edit-kind"
              name="productKind"
              defaultValue={
                KINDS.includes(row.product_kind as (typeof KINDS)[number])
                  ? row.product_kind
                  : "ebook"
              }
              className="w-full max-w-xs rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {tKinds(k)}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={row.is_active}
              className="h-4 w-4 rounded border-ink-100"
            />
            {t("activeLabel")}
          </label>

          <div>
            <label htmlFor="edit-file" className="block text-xs font-medium text-ink-700 mb-1">
              {t("replaceFileLabel")}
            </label>
            <input
              id="edit-file"
              name="replaceFile"
              type="file"
              accept=".pdf,.epub,.zip,application/pdf,application/epub+zip,application/zip"
              className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-[var(--radius-1)] file:border-0 file:bg-highlight file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary"
            />
            <p className="mt-1 text-[11px] text-ink-500">{t("replaceFileHint")}</p>
          </div>

          <div className="border-t border-ink-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
              {t("lemonSectionInEdit")}
            </p>
            <p className="text-[11px] text-ink-500 mb-2 leading-relaxed">{t("lemonInlineHint")}</p>
            <input type="hidden" name="hadLemonLinkBefore" value={row.lemonLink ? "1" : "0"} />
            <ContentProductLemonCell lemonLink={row.lemonLink} />
          </div>

          {state && !state.ok ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {editErrorMessage(t, state.error)}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className={cn(
                "inline-flex items-center justify-center rounded-[var(--radius-1)] px-4 py-2 text-sm font-medium transition-colors",
                pending
                  ? "bg-surface-03 text-ink-500 cursor-not-allowed"
                  : "bg-primary text-[var(--color-text-on-color)] hover:opacity-90",
              )}
            >
              {pending ? t("pendingSave") : t("saveChanges")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--radius-1)] border border-ink-100 px-4 py-2 text-sm text-ink-700 hover:bg-paper-50"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
