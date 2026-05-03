import { NextResponse } from "next/server";

/** Trimmed secret from `CONTENT_OPS_AUTOMATION_TOKEN`, or undefined if unset/blank. */
export function readContentOpsAutomationToken(): string | undefined {
  const t = process.env.CONTENT_OPS_AUTOMATION_TOKEN?.trim();
  return t || undefined;
}

export type AutomationPostAuthFailure =
  | { error: "automation_token_not_configured"; status: 500 }
  | { error: "unauthorized"; status: 401 };

/**
 * POST / authorization: `Authorization: Bearer <CONTENT_OPS_AUTOMATION_TOKEN>`.
 * - `strict_config`: missing env → 500 (automation-run).
 * - `missing_token_unauthorized`: missing env → 401 (daily-snapshot).
 */
export function checkAutomationPostBearer(
  req: Request,
  mode: "strict_config" | "missing_token_unauthorized",
): true | AutomationPostAuthFailure {
  const token = readContentOpsAutomationToken();
  if (!token) {
    return mode === "strict_config"
      ? { error: "automation_token_not_configured", status: 500 }
      : { error: "unauthorized", status: 401 };
  }
  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (auth !== `Bearer ${token}`) {
    return { error: "unauthorized", status: 401 };
  }
  return true;
}

export function jsonPostAuthFailure(failure: AutomationPostAuthFailure) {
  return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status });
}

/** GET ?token= matches server secret. */
export function isAutomationQueryTokenAuthorized(
  queryToken: string,
  serverToken: string | undefined,
): boolean {
  return Boolean(serverToken && queryToken === serverToken);
}
