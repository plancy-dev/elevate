/**
 * Server-only Lemon Squeezy REST API (JSON:API).
 * @see https://docs.lemonsqueezy.com/api/getting-started/requests
 */

const LEMON_API_BASE = "https://api.lemonsqueezy.com/v1";

export class LemonApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "LemonApiError";
    this.status = status;
  }
}

export function getLemonSqueezyServerConfig(): {
  apiKey: string;
  storeId: string;
} | null {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY?.trim();
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID?.trim();
  if (!apiKey || !storeId) {
    return null;
  }
  return { apiKey, storeId };
}

function extractJsonApiErrors(body: unknown): string {
  const o = body as { errors?: Array<{ detail?: string; title?: string }> };
  if (!Array.isArray(o?.errors) || o.errors.length === 0) {
    return "";
  }
  return o.errors
    .map((e) => (typeof e?.detail === "string" ? e.detail : null) ?? e?.title ?? "error")
    .join("; ");
}

async function lemonRequest(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  const res = await fetch(`${LEMON_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
      ...init?.headers,
    },
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const msg = extractJsonApiErrors(json) || text.slice(0, 500) || res.statusText;
    throw new LemonApiError(res.status, msg);
  }
  return json;
}

export type LemonProductSummary = {
  id: string;
  name: string;
  status: string;
};

export type LemonVariantSummary = {
  id: string;
  name: string;
  price: number;
  status: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

/**
 * Paginates until `maxPages` or no next link (store product lists are usually small).
 */
export async function listStoreProducts(
  apiKey: string,
  storeId: string,
  maxPages = 5,
): Promise<LemonProductSummary[]> {
  const out: LemonProductSummary[] = [];
  let url: string | null =
    `/products?filter[store_id]=${encodeURIComponent(storeId)}&page[size]=100&sort=name`;
  for (let p = 0; p < maxPages && url; p++) {
    const json = (await lemonRequest(apiKey, url)) as {
      data?: unknown[];
      links?: { next?: string | null };
    };
    const rows = Array.isArray(json?.data) ? json.data : [];
    for (const row of rows) {
      const r = asRecord(row);
      const id = typeof r?.id === "string" ? r.id : null;
      const attr = asRecord(r?.attributes);
      const name = typeof attr?.name === "string" ? attr.name : "";
      const status = typeof attr?.status === "string" ? attr.status : "";
      if (id) {
        out.push({ id, name, status });
      }
    }
    const next = json?.links?.next;
    if (typeof next === "string" && next.startsWith("http")) {
      try {
        const u = new URL(next);
        url = `${u.pathname.replace(/^\/v1/, "")}${u.search}`;
      } catch {
        url = null;
      }
    } else {
      url = null;
    }
  }
  return out;
}

export async function listVariantsForProduct(
  apiKey: string,
  productId: string,
): Promise<LemonVariantSummary[]> {
  const json = (await lemonRequest(
    apiKey,
    `/variants?filter[product_id]=${encodeURIComponent(productId)}&page[size]=100&sort=sort`,
  )) as { data?: unknown[] };
  const rows = Array.isArray(json?.data) ? json.data : [];
  const out: LemonVariantSummary[] = [];
  for (const row of rows) {
    const r = asRecord(row);
    const id = typeof r?.id === "string" ? r.id : null;
    const attr = asRecord(r?.attributes);
    const name = typeof attr?.name === "string" ? attr.name : "";
    const price = typeof attr?.price === "number" ? attr.price : 0;
    const status = typeof attr?.status === "string" ? attr.status : "";
    if (id) {
      out.push({ id, name, price, status });
    }
  }
  return out;
}

export type CreateLemonCheckoutSessionArgs = {
  variantId: string;
  customData: Record<string, string>;
  customPriceCents: number;
  redirectUrl: string | null;
  /** When true, creates a test-mode checkout (matches test API keys / test store). */
  testMode: boolean;
};

/**
 * Creates a one-off checkout with embedded custom data for webhooks.
 * @see https://docs.lemonsqueezy.com/api/checkouts/create-checkout
 */
export async function createLemonCheckoutSession(
  args: CreateLemonCheckoutSessionArgs,
): Promise<string> {
  const cfg = getLemonSqueezyServerConfig();
  if (!cfg) {
    throw new LemonApiError(503, "Lemon API is not configured (missing API key or store id).");
  }

  const attributes: Record<string, unknown> = {
    custom_price: args.customPriceCents,
    checkout_data: {
      custom: args.customData,
    },
    test_mode: args.testMode,
  };

  if (args.redirectUrl) {
    attributes.product_options = {
      redirect_url: args.redirectUrl,
    };
  }

  const body = {
    data: {
      type: "checkouts",
      attributes,
      relationships: {
        store: {
          data: {
            type: "stores",
            id: cfg.storeId,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: args.variantId,
          },
        },
      },
    },
  };

  const json = (await lemonRequest(cfg.apiKey, "/checkouts", {
    method: "POST",
    body: JSON.stringify(body),
  })) as { data?: { attributes?: { url?: string } } };

  const url = json?.data?.attributes?.url;
  if (typeof url !== "string" || !url.startsWith("http")) {
    throw new LemonApiError(502, "Checkout response missing checkout URL.");
  }
  return url;
}
