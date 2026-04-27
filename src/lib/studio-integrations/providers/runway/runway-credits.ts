import "server-only";

import RunwayML from "@runwayml/sdk";
import { RUNWAY_API_VERSION } from "@/lib/studio-integrations/runway-verify";

export type RunwayCreditCheckResult =
  | { ok: true; creditBalance: number }
  | {
      ok: false;
      code: "missing_key" | "insufficient_credits" | "api_error";
      message?: string;
      creditBalance?: number;
    };

/**
 * Runway org credit preflight via `organization.retrieve()`.
 * Falls back to runtime task errors if this call fails.
 */
export async function checkRunwayCredits(
  apiKey: string,
  estimatedCost: number,
): Promise<RunwayCreditCheckResult> {
  const key = apiKey.replace(/\s+/g, "").trim();
  if (!key) return { ok: false, code: "missing_key", message: "missing_key" };

  const client = new RunwayML({
    apiKey: key,
    runwayVersion: RUNWAY_API_VERSION,
    maxRetries: 1,
  });

  try {
    const org = await client.organization.retrieve();
    const balance =
      typeof org.creditBalance === "number" && Number.isFinite(org.creditBalance)
        ? org.creditBalance
        : NaN;
    if (!Number.isFinite(balance)) {
      return { ok: false, code: "api_error", message: "invalid_credit_balance" };
    }
    if (balance < estimatedCost) {
      return {
        ok: false,
        code: "insufficient_credits",
        message: `credit_balance=${balance}, estimated_cost=${estimatedCost}`,
        creditBalance: balance,
      };
    }
    return { ok: true, creditBalance: balance };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, code: "api_error", message: msg };
  }
}
