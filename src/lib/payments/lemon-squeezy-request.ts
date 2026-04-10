/**
 * Resolves Lemon webhook event name: prefer `X-Event-Name`, else JSON:API `meta.event_name`.
 */
export function getLemonWebhookEventName(
  body: unknown,
  headerEvent: string | null | undefined,
): string {
  const fromHeader = headerEvent?.trim();
  if (fromHeader) {
    return fromHeader;
  }
  if (body === null || typeof body !== "object") {
    return "";
  }
  const meta = (body as { meta?: unknown }).meta;
  if (meta === null || typeof meta !== "object" || Array.isArray(meta)) {
    return "";
  }
  const raw = (meta as { event_name?: unknown }).event_name;
  return typeof raw === "string" ? raw.trim() : "";
}
