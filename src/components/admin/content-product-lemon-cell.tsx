"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  clearContentProductLemonLink,
  listLemonProductsForAdmin,
  listLemonVariantsForAdmin,
  upsertContentProductLemonLink,
} from "@/actions/lemon-squeezy-catalog-admin";
import type { LemonProductSummary, LemonVariantSummary } from "@/lib/payments/lemon-squeezy-api";
import type { Database } from "@/types/database.types";
import { cn } from "@/lib/utils";

type ContentProductRow = Database["public"]["Tables"]["content_products"]["Row"];
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

export function ContentProductLemonCell({
  row,
  lemonLink,
}: {
  row: ContentProductRow;
  lemonLink: LemonLinkRow | null;
}) {
  const router = useRouter();
  const t = useTranslations("Dashboard.adminContent");
  const tLemon = useTranslations("Dashboard.adminContent.lemon");
  const [variantInput, setVariantInput] = useState(lemonLink?.lemon_variant_id ?? "");
  const [browseOpen, setBrowseOpen] = useState(false);
  const [products, setProducts] = useState<LemonProductSummary[] | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [variants, setVariants] = useState<LemonVariantSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

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

  function saveLink(variantId: string, lemonProductId: string | null) {
    setBanner(null);
    startTransition(async () => {
      const r = await upsertContentProductLemonLink({
        contentProductId: row.id,
        lemonVariantId: variantId,
        lemonProductId,
      });
      if (!r.ok) {
        setBanner({ kind: "err", text: lemonErrorMessage(t, r.error) });
        return;
      }
      setVariantInput(variantId);
      setBanner({ kind: "ok", text: tLemon("saveOk") });
      setBrowseOpen(false);
      resetBrowse();
      router.refresh();
    });
  }

  function saveQuick() {
    saveLink(variantInput.trim(), lemonLink?.lemon_product_id ?? null);
  }

  function onClear() {
    setBanner(null);
    startTransition(async () => {
      const r = await clearContentProductLemonLink(row.id);
      if (!r.ok) {
        setBanner({ kind: "err", text: lemonErrorMessage(t, r.error) });
        return;
      }
      setVariantInput("");
      setBanner({ kind: "ok", text: tLemon("clearOk") });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 min-w-[200px]">
      <div className="flex flex-wrap items-center gap-1">
        <input
          type="text"
          value={variantInput}
          onChange={(e) => setVariantInput(e.target.value)}
          placeholder={tLemon("variantPlaceholder")}
          className="w-full min-w-[120px] max-w-[160px] rounded border border-border-subtle bg-background px-2 py-1 text-[11px] font-mono"
          aria-label={tLemon("variantAria")}
        />
        <button
          type="button"
          disabled={pending}
          onClick={saveQuick}
          className={cn(
            "rounded border border-border-subtle px-2 py-1 text-[11px] font-medium",
            pending ? "opacity-50" : "hover:bg-layer-02",
          )}
        >
          {tLemon("save")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={openBrowse}
          className={cn(
            "rounded border border-border-subtle px-2 py-1 text-[11px] font-medium",
            pending ? "opacity-50" : "hover:bg-layer-02",
          )}
        >
          {tLemon("browse")}
        </button>
        {lemonLink ? (
          <button
            type="button"
            disabled={pending}
            onClick={onClear}
            className={cn(
              "rounded border border-border-subtle px-2 py-1 text-[11px] text-text-tertiary",
              pending ? "opacity-50" : "hover:bg-layer-02",
            )}
          >
            {tLemon("clear")}
          </button>
        ) : null}
      </div>
      {lemonLink ? (
        <p className="text-[10px] text-text-tertiary font-mono truncate" title={lemonLink.lemon_variant_id}>
          {tLemon("linked", { id: lemonLink.lemon_variant_id })}
        </p>
      ) : (
        <p className="text-[10px] text-text-tertiary">{tLemon("notLinked")}</p>
      )}
      {banner ? (
        <p
          className={cn(
            "text-[11px]",
            banner.kind === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
          )}
          role="status"
        >
          {banner.text}
        </p>
      ) : null}

      {browseOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lemon-browse-title"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-xl border border-border-subtle bg-background p-4 shadow-card">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 id="lemon-browse-title" className="text-sm font-semibold text-text-primary">
                {tLemon("modalTitle")}
              </h3>
              <button
                type="button"
                className="text-xs text-text-tertiary hover:text-text-primary"
                onClick={() => {
                  setBrowseOpen(false);
                  resetBrowse();
                }}
              >
                {tLemon("close")}
              </button>
            </div>
            <p className="text-xs text-text-secondary mb-3 leading-relaxed">{tLemon("modalIntro")}</p>
            {loadError ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2" role="alert">
                {loadError}
              </p>
            ) : null}
            {products === null ? (
              <p className="text-xs text-text-tertiary">{tLemon("loadingProducts")}</p>
            ) : products.length === 0 ? (
              <p className="text-xs text-text-secondary">{tLemon("emptyProducts")}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-medium text-text-tertiary mb-1">{tLemon("pickProduct")}</p>
                  <ul className="max-h-40 overflow-auto rounded border border-border-subtle divide-y divide-border-subtle">
                    {products.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={cn(
                            "w-full text-left px-2 py-2 text-xs hover:bg-layer-02",
                            selectedProductId === p.id && "bg-layer-02",
                          )}
                          onClick={() => onPickProduct(p.id)}
                        >
                          <span className="font-medium text-text-primary">{p.name}</span>
                          <span className="ml-2 font-mono text-text-tertiary">#{p.id}</span>
                          <span className="ml-2 text-text-tertiary">({p.status})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedProductId ? (
                  variants === null ? (
                    <p className="text-xs text-text-tertiary">{tLemon("loadingVariants")}</p>
                  ) : variants.length === 0 ? (
                    <p className="text-xs text-text-secondary">{tLemon("emptyVariants")}</p>
                  ) : (
                    <div>
                      <p className="text-[11px] font-medium text-text-tertiary mb-1">{tLemon("pickVariant")}</p>
                      <ul className="max-h-48 overflow-auto rounded border border-border-subtle divide-y divide-border-subtle">
                        {variants.map((v) => (
                          <li key={v.id}>
                            <button
                              type="button"
                              disabled={pending}
                              className="w-full text-left px-2 py-2 text-xs hover:bg-layer-02 disabled:opacity-50"
                              onClick={() => saveLink(v.id, selectedProductId)}
                            >
                              <span className="font-medium">{v.name}</span>
                              <span className="ml-2 font-mono text-text-tertiary">#{v.id}</span>
                              <span className="ml-2 tabular-nums text-text-secondary">
                                {tLemon("variantPrice", { amount: v.price })}
                              </span>
                              <span className="ml-2 text-text-tertiary">({v.status})</span>
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
