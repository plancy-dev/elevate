import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import type { OrgPlan } from "@/lib/organizations/plan";
import { hasPaidServiceSubscription } from "@/lib/organizations/plan";

type Props = {
  organizationName: string;
  plan: OrgPlan;
};

export async function BillingOrgSummary({ organizationName, plan }: Props) {
  const t = await getTranslations("Dashboard.billing");
  const paid = hasPaidServiceSubscription(plan);
  const planLabel =
    plan === "enterprise"
      ? t("orgPlanEnterprise")
      : plan === "professional"
        ? t("orgPlanProfessional")
        : t("orgPlanStarter");

  return (
    <section
      className="rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 p-5 space-y-3"
      aria-labelledby="billing-org-summary-heading"
    >
      <h2
        id="billing-org-summary-heading"
        className="text-xs font-semibold uppercase tracking-wider text-ink-500"
      >
        {t("orgSummaryTitle")}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-ink-900">{organizationName}</span>
        <Badge variant={paid ? "green" : "warm-gray"}>{planLabel}</Badge>
      </div>
      <p className="text-sm text-ink-700 leading-relaxed">
        {paid ? t("orgPaidNote") : t("orgStarterNote")}
      </p>
      <Link
        href="/dashboard/library"
        className="inline-flex text-sm font-medium text-primary hover:underline"
      >
        {t("orgSummaryLibraryCta")}
      </Link>
    </section>
  );
}
