"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  listLemonProductsForAdmin,
  listLemonVariantsForAdmin,
} from "@/actions/lemon-squeezy-catalog-admin";
import type { LemonProductSummary, LemonVariantSummary } from "@/lib/payments/lemon-squeezy-api";
import type { Database } from "@/types/database.types";
import { cn } from "@/lib/utils";

type LemonLinkRow = Database["public"]["Tables"]["content_product_lemon_links"]["Row"];

function lemonErrorMessage(
  t: ReturnType<typeof useTranslations>,
  code: string,
): string {
  switch (code) {
    case "unauthorized":
      return t("errors.unauthorized");
    case "forbidden":
      return t("errors.forbidden");
    case "lemon_api_not_configured":
      return t("lemon.errors.apiNotConfigured");
    case "invalid_payload":
      return t("lemon.errors.invalidPayload");
    case "unknown_product":
      return t("lemon.errors.unknownProduct");
    case "invalid_product":
      return t("lemon.errors.invalidProduct");
    case "db_failed":
      return t("lemon.errors.dbFailed");
    default:
      return code;
  }
}

export function ContentProductLemonCell({ lemonLink }: { lemonLink: LemonLinkRow | null }) {
  const t = useTranslations("Dashboard.adminContent");
  const tLemon = useTranslations("Dashboard.adminContent.lemon");
  const [variantInput, setVariantInput] = useState(lemonLink?.lemon_variant_id ?? "");
  const [lemonProductId, setLemonProductId] = useState(lemonLink?.lemon_product_id ?? "");
  const [browseOpen, setBrowseOpen] = useState(false);
  const [products, setProducts] = useState<LemonProductSummary[] | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [variants, setVariants] = useState<LemonVariantSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  function resetBrowse() {
    setProducts(null);
    setSelectedProductId(null);
    setVariants(null);
    setLoadError(null);
  }

  function openBrowse() {
    resetBrowse();
    setBrowseOpen(true);
    void (async () => {
      const r = await listLemonProductsForAdmin();
      if (!r.ok) {
        setLoadError(lemonErrorMessage(t, r.error));
        setProducts([]);
        return;
      }
      setProducts(r.products);
    })();
  }

  function onPickProduct(productId: string) {
    setSelectedProductId(productId);
    setVariants(null);
    void (async () => {
      const r = await listLemonVariantsForAdmin(productId);
      if (!r.ok) {
        setLoadError(
          ["unauthorized", "forbidden", "lemon_api_not_configured", "invalid_product"].includes(
            r.error,
          )
            ? lemonErrorMessage(t, r.error)
            : r.error,
        );
        return;
      }
      setVariants(r.variants);
      setLoadError(null);
    })();
  }

  function pickVariant(variantId: string, productId: string | null) {
    setVariantInput(variantId);
    setLemonProductId(productId ?? "");
    setBrowseOpen(false);
    resetBrowse();
  }

  function onClearLocal() {
    setVariantInput("");
    setLemonProductId("");
  }

  const showClear = variantInput.trim() !== "" || Boolean(lemonLink?.lemon_variant_id);

  return (
    <div className="space-y-2 min-w-[200px]">
      <input type="hidden" name="lemonProductId" value={lemonProductId} />
      <div className="flex flex-wrap items-center gap-1">
        <input
          type="text"
          name="lemonVariantId"
          value={variantInput}
          onChange={(e) => setVariantInput(e.target.value)}
          placeholder={tLemon("variantPlaceholder")}
          className="w-full min-w-[120px] max-w-[200px] rounded border border-ink-100 bg-paper-50 px-2 py-1 text-[11px] font-mono"
          aria-label={tLemon("variantAria")}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={openBrowse}
          className={cn(
            "rounded border border-ink-100 px-2 py-1 text-[11px] font-medium hover:bg-paper-50",
          )}
        >
          {tLemon("browse")}
        </button>
        {showClear ? (
          <button
            type="button"
            onClick={onClearLocal}
            className={cn(
              "rounded border border-ink-100 px-2 py-1 text-[11px] text-ink-500 hover:bg-paper-50",
            )}
          >
            {tLemon("clear")}
          </button>
        ) : null}
      </div>
      {variantInput.trim() ? (
        <p
          className="text-[10px] text-ink-500 font-mono truncate"
          title={variantInput.trim()}
        >
          {tLemon("linked", { id: variantInput.trim() })}
        </p>
      ) : (
        <p className="text-[10px] text-ink-500">{tLemon("notLinked")}</p>
      )}

      {browseOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lemon-browse-title"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 id="lemon-browse-title" className="text-sm font-semibold text-ink-900">
                {tLemon("modalTitle")}
              </h3>
              <button
                type="button"
                className="text-xs text-ink-500 hover:text-ink-900"
                onClick={() => {
                  setBrowseOpen(false);
                  resetBrowse();
                }}
              >
                {tLemon("close")}
              </button>
            </div>
            <p className="text-xs text-ink-700 mb-3 leading-relaxed">{tLemon("modalIntro")}</p>
            {loadError ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2" role="alert">
                {loadError}
              </p>
            ) : null}
            {products === null ? (
              <p className="text-xs text-ink-500">{tLemon("loadingProducts")}</p>
            ) : products.length === 0 ? (
              <p className="text-xs text-ink-700">{tLemon("emptyProducts")}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-medium text-ink-500 mb-1">{tLemon("pickProduct")}</p>
                  <ul className="max-h-40 overflow-auto rounded border border-ink-100 divide-y divide-ink-100">
                    {products.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={cn(
                            "w-full text-left px-2 py-2 text-xs hover:bg-paper-50",
                            selectedProductId === p.id && "bg-paper-50",
                          )}
                          onClick={() => onPickProduct(p.id)}
                        >
                          <span className="font-medium text-ink-900">{p.name}</span>
                          <span className="ml-2 font-mono text-ink-500">#{p.id}</span>
                          <span className="ml-2 text-ink-500">({p.status})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedProductId ? (
                  variants === null ? (
                    <p className="text-xs text-ink-500">{tLemon("loadingVariants")}</p>
                  ) : variants.length === 0 ? (
                    <p className="text-xs text-ink-700">{tLemon("emptyVariants")}</p>
                  ) : (
                    <div>
                      <p className="text-[11px] font-medium text-ink-500 mb-1">{tLemon("pickVariant")}</p>
                      <ul className="max-h-48 overflow-auto rounded border border-ink-100 divide-y divide-ink-100">
                        {variants.map((v) => (
                          <li key={v.id}>
                            <button
                              type="button"
                              className="w-full text-left px-2 py-2 text-xs hover:bg-paper-50"
                              onClick={() => pickVariant(v.id, selectedProductId)}
                            >
                              <span className="font-medium">{v.name}</span>
                              <span className="ml-2 font-mono text-ink-500">#{v.id}</span>
                              <span className="ml-2 tabular-nums text-ink-700">
                                {tLemon("variantPrice", { amount: v.price })}
                              </span>
                              <span className="ml-2 text-ink-500">({v.status})</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
