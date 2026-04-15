"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BILLING_RETURN_FLASH_QUERY,
  isBillingReturnFlashValue,
} from "@/lib/billing/billing-return-flash";
import { toast } from "@/lib/ui/app-toast";

/**
 * Fires at most once when `billingReturn` is present, then removes it from the URL.
 */
export function BillingReturnFlashToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Dashboard.billing");
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const raw = searchParams.get(BILLING_RETURN_FLASH_QUERY);
    if (!raw || !isBillingReturnFlashValue(raw)) return;
    fired.current = true;

    if (raw === "success") {
      toast.success(t("flashReturnSuccess"));
    } else {
      toast.error(t("flashReturnFail"));
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete(BILLING_RETURN_FLASH_QUERY);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, t]);

  return null;
}
