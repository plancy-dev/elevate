export function getNestedMessage(
  messages: unknown,
  dottedPath: string,
): string | undefined {
  const segments = dottedPath.split(".");
  let current: unknown = messages;
  for (const segment of segments) {
    if (!current || typeof current !== "object") return undefined;
    const value = (current as Record<string, unknown>)[segment];
    if (value === undefined) return undefined;
    current = value;
  }
  return typeof current === "string" ? current : undefined;
}
