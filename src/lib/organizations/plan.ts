import type { Database } from "@/types/database.types";

export type OrgPlan = Database["public"]["Enums"]["org_plan"];

/**
 * Library and other paid features treat Professional / Enterprise as an active
 * service subscription; Starter is the default self-serve tier without that plan.
 */
export function hasPaidServiceSubscription(plan: OrgPlan | null): boolean {
  if (!plan) return false;
  return plan === "professional" || plan === "enterprise";
}
