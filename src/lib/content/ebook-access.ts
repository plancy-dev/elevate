import type { OrgPlan } from "@/lib/organizations/plan";
import { hasPaidServiceSubscription } from "@/lib/organizations/plan";

/**
 * Single gate for catalog Library access (the “allowlist” in product terms):
 *
 * 1. **Subscription** — org `plan` is Professional or Enterprise (`hasPaidServiceSubscription`), or
 * 2. **Per-SKU purchase** — a row exists in `organization_content_entitlements` for that product
 *    (typically after payment confirmation via `grantOrganizationContentEntitlement`).
 *
 * Marketing waitlist emails (`waitlist_signups`) do **not** grant read access.
 * For the full narrative vs `waitlist`, see `docs/EBOOK_READ_ALLOWLIST.md` and
 * `docs/CONTENT_FUNNEL.md`. `delivery_mode: web_only` blocks signed file download;
 * it is not full DRM (browser copy remains possible).
 */
export function canReadCatalogProduct(args: {
  organizationPlan: OrgPlan | null;
  entitledProductIds: Set<string>;
  productId: string;
}): boolean {
  if (hasPaidServiceSubscription(args.organizationPlan)) {
    return true;
  }
  return args.entitledProductIds.has(args.productId);
}
