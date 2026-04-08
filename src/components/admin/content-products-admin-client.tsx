"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  uploadContentProduct,
  type UploadContentProductResult,
} from "@/actions/content-products-admin";
import { TOSS_POC_AMOUNT_KRW } from "@/lib/payments/toss-poc";
import type { Database } from "@/types/database.types";
import { cn } from "@/lib/utils";

type ContentProductRow = Database["public"]["Tables"]["content_products"]["Row"];

const KINDS = ["ebook", "guide", "template", "bundle"] as const;

function formatKrwFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

function errorMessage(
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

export function ContentProductsAdminClient({
  initialRows,
}: {
  initialRows: ContentProductRow[];
}) {
  const t = useTranslations("Dashboard.adminContent");
  const tKinds = useTranslations("Dashboard.library.productKind");
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    uploadContentProduct,
    undefined as UploadContentProductResult | undefined,
  );

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state?.ok, router]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          {t("listHeading")}
        </h2>
        {initialRows.length === 0 ? (
          <p className="text-sm text-text-secondary">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-subtle shadow-ambient">
            <table className="w-full text-left text-sm">
              <thead className="bg-layer-02 text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("colSlug")}</th>
                  <th className="px-3 py-2 font-medium">{t("colTitle")}</th>
                  <th className="px-3 py-2 font-medium">{t("colKind")}</th>
                  <th className="px-3 py-2 font-medium">{t("colPrice")}</th>
                  <th className="px-3 py-2 font-medium">{t("colActive")}</th>
                  <th className="px-3 py-2 font-medium min-w-[140px]">
                    {t("colStorage")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-border-subtle hover:bg-layer-01"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{row.slug}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate" title={row.title}>
                      {row.title}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {KINDS.includes(row.product_kind as (typeof KINDS)[number])
                        ? tKinds(row.product_kind as (typeof KINDS)[number])
                        : row.product_kind}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatKrwFromCents(row.price_cents)}
                    </td>
                    <td className="px-3 py-2">
                      {row.is_active ? t("yes") : t("no")}
                    </td>
                    <td
                      className="px-3 py-2 font-mono text-[11px] text-text-tertiary max-w-[220px] truncate"
                      title={row.storage_object_path ?? ""}
                    >
                      {row.storage_object_path ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          {t("formHeading")}
        </h2>
        <form action={formAction} className="max-w-lg space-y-4">
          <div>
            <label htmlFor="cp-slug" className="block text-xs font-medium text-text-secondary mb-1">
              {t("slug")}
            </label>
            <input
              id="cp-slug"
              name="slug"
              type="text"
              required
              className="w-full rounded-sm border border-border-subtle bg-background px-3 py-2 text-sm"
              placeholder="team-alignment-ebook"
              autoComplete="off"
            />
            <p className="mt-1 text-[11px] text-text-tertiary">{t("slugHint")}</p>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                name="replaceExisting"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-subtle"
              />
              <span>{t("replaceExisting")}</span>
            </label>
          </div>
          <div>
            <label htmlFor="cp-title" className="block text-xs font-medium text-text-secondary mb-1">
              {t("titleLabel")}
            </label>
            <input
              id="cp-title"
              name="title"
              type="text"
              required
              className="w-full rounded-sm border border-border-subtle bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="cp-desc" className="block text-xs font-medium text-text-secondary mb-1">
              {t("description")}
            </label>
            <textarea
              id="cp-desc"
              name="description"
              rows={3}
              className="w-full rounded-sm border border-border-subtle bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="cp-price" className="block text-xs font-medium text-text-secondary mb-1">
              {t("priceKrw")}
            </label>
            <input
              id="cp-price"
              name="priceKrw"
              type="number"
              min={0}
              step={1}
              defaultValue={TOSS_POC_AMOUNT_KRW}
              className="w-full max-w-[200px] rounded-sm border border-border-subtle bg-background px-3 py-2 text-sm tabular-nums"
            />
          </div>
          <div>
            <label htmlFor="cp-kind" className="block text-xs font-medium text-text-secondary mb-1">
              {t("productKind")}
            </label>
            <select
              id="cp-kind"
              name="productKind"
              defaultValue="ebook"
              className="w-full max-w-xs rounded-sm border border-border-subtle bg-background px-3 py-2 text-sm"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {tKinds(k)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cp-file" className="block text-xs font-medium text-text-secondary mb-1">
              {t("file")}
            </label>
            <input
              id="cp-file"
              name="file"
              type="file"
              required
              accept=".pdf,.epub,.zip,application/pdf,application/epub+zip,application/zip"
              className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-sm file:border-0 file:bg-highlight file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary"
            />
            <p className="mt-1 text-[11px] text-text-tertiary">{t("fileHint")}</p>
          </div>

          {state && !state.ok ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {errorMessage(t, state.error)}
            </p>
          ) : null}
          {state?.ok ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              {state.replaced ? t("successReplaced") : t("successCreated")}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={cn(
              "inline-flex items-center justify-center rounded-sm px-4 py-2 text-sm font-medium transition-colors",
              pending
                ? "bg-surface-03 text-text-tertiary cursor-not-allowed"
                : "bg-primary text-[var(--color-text-on-color)] hover:opacity-90",
            )}
          >
            {pending ? t("pending") : t("submit")}
          </button>
        </form>
      </section>
    </div>
  );
}
