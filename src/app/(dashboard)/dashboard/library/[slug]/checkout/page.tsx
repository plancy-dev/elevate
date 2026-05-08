import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidCatalogSlug } from "@/lib/content/catalog-slug";
import { resolveLemonCheckoutForBillingPage } from "@/lib/payments/resolve-lemon-checkout-for-billing";
import { resolveAppOrigin } from "@/lib/url/resolve-app-origin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/**
 * One-click Lemon checkout: redirects straight to the payment provider.
 */
export default async function LibraryCatalogCheckoutRedirectPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidCatalogSlug(slug)) {
    redirect("/dashboard/library");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const origin = await resolveAppOrigin();
  const successPath = `/dashboard/library/${encodeURIComponent(slug)}?checkout=success`;
  const r = await resolveLemonCheckoutForBillingPage({
    contentProductSlug: slug,
    organizationId: prof?.organization_id ?? null,
    appOrigin: origin,
    checkoutSuccessPath: successPath,
  });

  if (r.checkoutUrl) {
    redirect(r.checkoutUrl);
  }

  const q = new URLSearchParams();
  q.set("checkout", "error");
  if ("reason" in r && r.reason) {
    q.set("reason", r.reason);
  }
  redirect(`/dashboard/library/${encodeURIComponent(slug)}?${q.toString()}`);
}
