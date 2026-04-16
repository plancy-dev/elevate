import dns from "node:dns/promises";
import net from "node:net";

export const URL_EXTRACT_MAX_URL_LENGTH = 2048;

export class UrlNotAllowedError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid"
      | "protocol"
      | "length"
      | "host"
      | "dns"
      | "private_ip",
  ) {
    super(message);
    this.name = "UrlNotAllowedError";
  }
}

function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const a = parts[0] ?? 0;
    const b = parts[1] ?? 0;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe80:")) return true;
    return false;
  }
  return true;
}

/**
 * Validates URL for server-side fetch (SSRF mitigation).
 * Resolves DNS and rejects private/reserved target IPs.
 */
export async function assertUrlSafeForFetch(raw: string): Promise<URL> {
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new UrlNotAllowedError("Invalid URL.", "invalid");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UrlNotAllowedError("Only http(s) URLs are allowed.", "protocol");
  }
  if (trimmed.length > URL_EXTRACT_MAX_URL_LENGTH) {
    throw new UrlNotAllowedError("URL is too long.", "length");
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "[::1]"
  ) {
    throw new UrlNotAllowedError("This host is not allowed.", "host");
  }

  let records: { address: string }[];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new UrlNotAllowedError("Could not resolve host.", "dns");
  }
  if (records.length === 0) {
    throw new UrlNotAllowedError("Could not resolve host.", "dns");
  }
  for (const r of records) {
    if (isPrivateOrReservedIp(r.address)) {
      throw new UrlNotAllowedError("Target address is not allowed.", "private_ip");
    }
  }

  return url;
}
