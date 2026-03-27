/**
 * Structured auth-flow tracing for password recovery / PKCE / hash flows.
 * Tokens are never logged — only lengths, param names, and routing decisions.
 *
 * Browser: logs to console + rolling buffer in sessionStorage (`AUTH_FLOW_STORAGE_KEY`).
 * Server/Edge: console only (Vercel function logs).
 *
 * Disable client noise: `NEXT_PUBLIC_AUTH_FLOW_DEBUG=0`
 */

export const AUTH_FLOW_STORAGE_KEY = "elevate_auth_flow_v1";
const PREFIX = "[elevate-auth-flow]";
const MAX_EVENTS = 48;

/** Set `NEXT_PUBLIC_AUTH_FLOW_DEBUG=0` to silence auth-flow console + sessionStorage logs. */
export function isAuthFlowDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_FLOW_DEBUG !== "0";
}

/** Safe query snapshot: PKCE `code` replaced with length only. */
export function snapshotSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key === "code") {
      out[key] = `[len:${value.length}]`;
      return;
    }
    out[key] = value.length > 200 ? `${value.slice(0, 200)}…` : value;
  });
  return out;
}

/** Hash fragment: only param names and non-secret values (type, error_*). */
export function snapshotHashParams(hash: string): Record<string, string> {
  if (!hash || hash.length <= 1) return {};
  const params = new URLSearchParams(hash.slice(1));
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    if (key === "access_token" || key === "refresh_token") {
      out[key] = `[len:${value.length}]`;
      return;
    }
    out[key] = value.length > 120 ? `${value.slice(0, 120)}…` : value;
  });
  return out;
}

export function redactHref(href: string): string {
  try {
    const u = new URL(href);
    if (u.searchParams.has("code")) {
      const len = u.searchParams.get("code")?.length ?? 0;
      u.searchParams.set("code", `[len:${len}]`);
    }
    if (u.hash.length > 1) {
      u.hash = "#[hash:redacted]";
    }
    return u.pathname + u.search + u.hash;
  } catch {
    return "[invalid-href]";
  }
}

export function logAuthFlow(
  phase: string,
  data: Record<string, unknown> = {},
): void {
  if (!isAuthFlowDebugEnabled()) return;
  const payload = {
    t: new Date().toISOString(),
    phase,
    ...data,
  };
  const line = JSON.stringify(payload);
  console.info(`${PREFIX} ${line}`);

  if (typeof window === "undefined") return;

  try {
    const raw = sessionStorage.getItem(AUTH_FLOW_STORAGE_KEY);
    const arr: unknown[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return;
    arr.push(payload);
    while (arr.length > MAX_EVENTS) arr.shift();
    sessionStorage.setItem(AUTH_FLOW_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // ignore quota / private mode
  }
}

/** For pasting into GitHub / Linear (browser console): copy session buffer. */
export function copyAuthFlowLogToClipboard(): Promise<void> {
  const raw = sessionStorage.getItem(AUTH_FLOW_STORAGE_KEY);
  const text = raw ?? "[]";
  return navigator.clipboard.writeText(text);
}
